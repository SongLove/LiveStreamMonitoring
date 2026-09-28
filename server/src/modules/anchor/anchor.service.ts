import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Anchor, AnchorDocument, Platform } from './anchor.schema';
import { looksLikeDouyinUserId } from '../crawler/providers/douyin-input';
import { isIncompleteDouyinProfile } from '../crawler/providers/douyin-playwright.provider';
import { extractKuaishouId } from '../crawler/providers/kuaishou-parse';
import { CrawlerService } from '../crawler/crawler.service';

/**
 * MongoDB 禁止同一路径同时出现在 $set 与 $setOnInsert。
 * 有头像只 $set；无头像只在插入时写入空串，避免覆盖已有头像。
 */
export function buildAnchorProfileUpdate(resolved: {
  nickname: string;
  avatarUrl?: string;
  profileUrl: string;
  roomId?: string;
}) {
  const $set: Record<string, unknown> = {
    nickname: resolved.nickname,
    profileUrl: resolved.profileUrl,
    roomId: resolved.roomId || '',
    status: 'active',
  };
  const $setOnInsert: Record<string, unknown> = {
    pollTier: 2,
    liveState: 'offline',
  };
  const avatar = (resolved.avatarUrl || '').trim();
  if (avatar) $set.avatarUrl = avatar;
  else $setOnInsert.avatarUrl = '';
  return { $set, $setOnInsert };
}

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

    // 抖音：按用户 ID（抖音号，如 kelie329157）搜索
    let query = q;
    if (platform === 'douyin') {
      const userUrl = q.match(/douyin\.com\/user\/([^?&#/]+)/i);
      if (userUrl) {
        try {
          query = decodeURIComponent(userUrl[1]).trim();
        } catch {
          query = userUrl[1];
        }
      } else if (/douyin\.com\/(?:jingxuan\/)?search\//i.test(q)) {
        throw new BadRequestException(
          '请输入抖音号（用户 ID，如 kelie329157），不要使用搜索页链接。',
        );
      }

      if (!looksLikeDouyinUserId(query)) {
        throw new BadRequestException(
          '请输入抖音号（如 kelie329157），不支持按昵称搜索。',
        );
      }

      const local = await this.anchorModel
        .find({
          platform: 'douyin',
          $or: [{ platformUid: query }, { roomId: query }],
        })
        .limit(5)
        .lean();

      // 完整资料可直接返回；占位（昵称=抖音号且无头像）必须重新 resolve
      const complete = local.filter((d) => !isIncompleteDouyinProfile(d));
      if (complete.length > 0) return complete;

      const doc = await this.resolve('douyin', query);
      return [doc.toObject()];
    }

    if (platform === 'kuaishou') {
      const query = extractKuaishouId(q);
      if (!query) {
        throw new BadRequestException(
          '请输入快手号，或直播间链接 live.kuaishou.com/u/快手号',
        );
      }
      const local = await this.anchorModel
        .find({
          platform: 'kuaishou',
          $or: [{ platformUid: query }, { roomId: query }],
        })
        .limit(5)
        .lean();
      const complete = local.filter(
        (d) => (d.avatarUrl || '').trim() && (d.nickname || '').trim(),
      );
      if (complete.length > 0) return complete;
      const doc = await this.resolve('kuaishou', query);
      return [doc.toObject()];
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

    if (/^\d+$/.test(query)) {
      const doc = await this.resolve('bilibili', query);
      return [doc.toObject()];
    }
    return [];
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
        '抖音用户 ID 无效，请输入抖音号（如 kelie329157）',
      );
    }
    const doc = await this.anchorModel.findOneAndUpdate(
      { platform, platformUid: resolved.platformUid },
      buildAnchorProfileUpdate(resolved),
      { upsert: true, new: true },
    );

    // 清理历史占位：曾用抖音号当 platformUid 的假记录
    if (
      platform === 'douyin' &&
      resolved.roomId &&
      resolved.platformUid !== resolved.roomId
    ) {
      await this.anchorModel.deleteMany({
        platform: 'douyin',
        platformUid: resolved.roomId,
        _id: { $ne: doc._id },
      });
    }

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
