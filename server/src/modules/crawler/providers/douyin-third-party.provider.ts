import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './provider.types';
import { assertStableDouyinUid, parseDouyinInput } from './douyin-input';

@Injectable()
export class DouyinThirdPartyProvider implements LiveProvider {
  readonly name = 'douyin-third-party';
  readonly platform = 'douyin' as const;
  private readonly logger = new Logger(DouyinThirdPartyProvider.name);

  constructor(private readonly config: ConfigService) {}

  private get base() {
    return (this.config.get<string>('douyin.thirdPartyBaseUrl') || '').replace(/\/$/, '');
  }

  private get apiKey() {
    return this.config.get<string>('douyin.thirdPartyApiKey') || '';
  }

  private get configured() {
    return Boolean(this.base && this.apiKey);
  }

  async healthCheck() {
    if (!this.configured) return { ok: true, detail: 'third-party not configured' };
    try {
      await axios.get(this.base, {
        timeout: 5000,
        headers: { Authorization: `Bearer ${this.apiKey}` },
        validateStatus: () => true,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }

  /**
   * 关键词搜索用户（TikHub: POST /api/v1/douyin/search/fetch_user_search_v2）
   * @see https://docs.tikhub.io/370212785e0
   */
  async searchUsers(keyword: string): Promise<NormalizedAnchorProfile[]> {
    const q = keyword.trim();
    if (!q) return [];
    if (!this.configured) {
      throw new BadRequestException(
        '抖音用户搜索需要配置 DOUYIN_THIRD_PARTY_BASE_URL 与 DOUYIN_THIRD_PARTY_API_KEY（推荐 TikHub fetch_user_search_v2）',
      );
    }
    const { data } = await axios.post(
      `${this.base}/api/v1/douyin/search/fetch_user_search_v2`,
      { keyword: q, cursor: 0 },
      {
        timeout: 20000,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      },
    );
    const list = data?.data?.user_list || data?.user_list || [];
    return (Array.isArray(list) ? list : [])
      .map((row: any) => this.mapUserRow(row))
      .filter((p: NormalizedAnchorProfile | null): p is NormalizedAnchorProfile => !!p);
  }

  async resolve(input: string): Promise<NormalizedAnchorProfile> {
    const parsed = parseDouyinInput(input);

    if (parsed.kind === 'search_keyword') {
      const users = await this.searchUsers(parsed.keyword);
      if (!users.length) {
        throw new BadRequestException(`未找到抖音用户：${parsed.keyword}`);
      }
      return users[0];
    }

    if (parsed.kind === 'sec_uid') {
      assertStableDouyinUid(parsed.secUid);
      if (this.configured) {
        // 用搜索/详情能力补全昵称头像（无单独接口时退回 sec_uid 自身）
        try {
          const users = await this.searchUsers(parsed.secUid);
          const hit = users.find((u) => u.platformUid === parsed.secUid);
          if (hit) return hit;
        } catch (e) {
          this.logger.warn(`douyin resolve enrich failed: ${(e as Error).message}`);
        }
      }
      return {
        platform: 'douyin',
        platformUid: parsed.secUid,
        nickname: `抖音用户${parsed.secUid.slice(0, 8)}`,
        avatarUrl: '',
        profileUrl: `https://www.douyin.com/user/${parsed.secUid}`,
      };
    }

    if (parsed.kind === 'live_id') {
      if (!this.configured) {
        throw new BadRequestException(
          '解析抖音直播间需要配置第三方 API，或改用用户主页链接 / 关键词搜索',
        );
      }
      // 直播间 ID → 需第三方 room 接口；未接时明确失败，禁止伪造 uid
      throw new BadRequestException(
        `暂不支持仅凭直播间号 ${parsed.liveId} 解析，请粘贴用户主页链接或用昵称搜索`,
      );
    }

    // share_text：尽量抽出短链或关键词
    const urlInText = input.match(/https?:\/\/[^\s]+/i)?.[0];
    if (urlInText) return this.resolve(urlInText);
    throw new BadRequestException('无法解析抖音分享文案，请粘贴用户主页链接或搜索关键词');
  }

  /**
   * Douyin room status 0 often means live — normalize inside provider.
   */
  async fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]> {
    if (!this.configured) {
      return uids.map((uid) => ({
        platform: 'douyin' as const,
        platformUid: uid,
        status: 'not_live' as const,
        title: '',
        coverUrl: '',
        liveUrl: '',
        provider: this.name,
        fetchedAt: new Date(),
        confidence: 0.5,
      }));
    }
    try {
      const { data } = await axios.post(
        `${this.base}/douyin/live/batch`,
        { uids },
        {
          timeout: 15000,
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );
      const rows = data?.data || data || [];
      return uids.map((uid) => {
        const row = Array.isArray(rows)
          ? rows.find((r: any) => String(r.uid || r.sec_uid) === uid)
          : rows[uid];
        const roomStatus = row?.room_status ?? row?.status;
        const isLive = roomStatus === 0 || roomStatus === 'live';
        return {
          platform: 'douyin' as const,
          platformUid: uid,
          status: isLive ? ('live' as const) : ('not_live' as const),
          title: row?.title || '',
          coverUrl: row?.cover || '',
          liveUrl: row?.url || '',
          provider: this.name,
          fetchedAt: new Date(),
          confidence: 0.85,
        };
      });
    } catch (e) {
      this.logger.error(`douyin third-party failed: ${(e as Error).message}`);
      throw e;
    }
  }

  private mapUserRow(row: any): NormalizedAnchorProfile | null {
    const info = row?.user_info || row?.user || row;
    const secUid = String(info?.sec_uid || info?.secUid || '').trim();
    if (!secUid) return null;
    const avatar =
      info?.avatar_larger?.url_list?.[0] ||
      info?.avatar_medium?.url_list?.[0] ||
      info?.avatar_thumb?.url_list?.[0] ||
      info?.avatar_url ||
      '';
    return {
      platform: 'douyin',
      platformUid: secUid,
      nickname: info?.nickname || info?.unique_id || secUid.slice(0, 8),
      avatarUrl: avatar,
      profileUrl: `https://www.douyin.com/user/${secUid}`,
      roomId: info?.unique_id || '',
    };
  }
}
