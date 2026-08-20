import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Anchor, AnchorDocument, Platform } from './anchor.schema';
import { CrawlerService } from '../crawler/crawler.service';

@Injectable()
export class AnchorService {
  constructor(
    @InjectModel(Anchor.name) private readonly anchorModel: Model<AnchorDocument>,
    private readonly crawler: CrawlerService,
  ) {}

  async findById(id: string) {
    const a = await this.anchorModel.findById(id);
    if (!a) throw new NotFoundException('Anchor not found');
    return a;
  }

  async search(platform: Platform, keyword: string) {
    const q = keyword.trim();
    if (!q) return [];

    // 抖音搜索页 URL → 提取关键词
    let query = q;
    if (platform === 'douyin') {
      const m = q.match(/douyin\.com\/(?:jingxuan\/)?search\/([^?&#/]+)/i);
      if (m) {
        try {
          query = decodeURIComponent(m[1]).trim();
        } catch {
          query = m[1];
        }
      }
    }

    const local = await this.anchorModel
      .find({
        platform,
        $or: [
          { nickname: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { platformUid: query },
          { roomId: query },
        ],
      })
      .limit(20)
      .lean();

    if (local.length > 0) return local;

    // 本地未命中：走 Provider 外部搜索（抖音需第三方）
    const remote = await this.crawler.searchUsers(platform, query);
    const saved: unknown[] = [];
    for (const r of remote.slice(0, 20)) {
      const doc = await this.anchorModel.findOneAndUpdate(
        { platform: r.platform, platformUid: r.platformUid },
        {
          $set: {
            nickname: r.nickname,
            avatarUrl: r.avatarUrl,
            profileUrl: r.profileUrl,
            roomId: r.roomId || '',
            status: 'active',
          },
          $setOnInsert: { pollTier: 2, liveState: 'offline' },
        },
        { upsert: true, new: true },
      );
      saved.push(doc.toObject());
    }
    return saved;
  }

  async resolve(platform: Platform, input: string) {
    const resolved = await this.crawler.resolve(platform, input);
    // 禁止把中文昵称 / URL 编码片段当成稳定主键
    if (
      platform === 'douyin' &&
      (/[\u4e00-\u9fff]/.test(resolved.platformUid) ||
        resolved.platformUid.includes('%') ||
        resolved.platformUid.includes('?'))
    ) {
      throw new BadRequestException(
        '抖音解析未得到稳定 sec_uid，请配置第三方搜索或粘贴用户主页链接',
      );
    }
    const doc = await this.anchorModel.findOneAndUpdate(
      { platform, platformUid: resolved.platformUid },
      {
        $set: {
          nickname: resolved.nickname,
          avatarUrl: resolved.avatarUrl,
          profileUrl: resolved.profileUrl,
          roomId: resolved.roomId || '',
          status: 'active',
        },
        $setOnInsert: { pollTier: 2, liveState: 'offline' },
      },
      { upsert: true, new: true },
    );
    return doc;
  }

  async recalculatePollTier(anchorId: string) {
    const anchor = await this.findById(anchorId);
    const count = anchor.subscriberCount || 0;
    let tier = 3;
    if (count >= 50) tier = 1;
    else if (count >= 10) tier = 2;
    if (anchor.pollTier !== tier) {
      anchor.pollTier = tier;
      await anchor.save();
    }
    return tier;
  }

  async bumpSubscriberCount(anchorId: string, delta: number) {
    await this.anchorModel.updateOne(
      { _id: anchorId },
      { $inc: { subscriberCount: delta } },
    );
    await this.recalculatePollTier(anchorId);
  }

  async listDue(limit = 100) {
    const now = new Date();
    return this.anchorModel
      .find({
        status: 'active',
        $or: [{ lastPolledAt: null }, { lastPolledAt: { $lte: now } }],
      })
      .sort({ pollTier: 1, lastPolledAt: 1 })
      .limit(limit);
  }

  async adminList(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.anchorModel
        .find()
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.anchorModel.countDocuments(),
    ]);
    return { items, total, page, pageSize };
  }
}
