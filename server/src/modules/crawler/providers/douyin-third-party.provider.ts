import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './provider.types';
import { assertDouyinUserId, parseDouyinInput } from './douyin-input';
import { ProviderSkippedError } from './provider-skip.error';

/**
 * 抖音资料解析：按抖音号 / sec_uid 拉取真实昵称、头像。
 * 资料接口：TikHub GET /api/v1/douyin/web/handler_user_profile_v2?unique_id=
 * @see https://docs.tikhub.io/232379586e0
 */
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

  private requireConfiguredOrSkip(action: string) {
    if (!this.configured) {
      throw new ProviderSkippedError(
        this.name,
        `${action}: DOUYIN_THIRD_PARTY_* 未配置`,
      );
    }
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

  async searchUsers(_keyword: string): Promise<NormalizedAnchorProfile[]> {
    throw new BadRequestException(
      '抖音请按用户 ID（抖音号，如 kelie329157）搜索，不支持昵称。',
    );
  }

  async resolve(input: string): Promise<NormalizedAnchorProfile> {
    const parsed = parseDouyinInput(input);

    if (parsed.kind === 'search_keyword') {
      throw new BadRequestException(
        '请输入抖音号（用户 ID，如 kelie329157），不支持昵称或搜索页链接。',
      );
    }

    if (parsed.kind === 'user_id') {
      assertDouyinUserId(parsed.userId);
      this.requireConfiguredOrSkip('查询抖音主播资料');
      return this.fetchProfile(parsed.userId, parsed.idType);
    }

    if (parsed.kind === 'live_id') {
      throw new BadRequestException(
        '请使用抖音号（用户 ID）添加，暂不支持仅凭直播间号。',
      );
    }

    const urlInText = input.match(/https?:\/\/[^\s]+/i)?.[0];
    if (urlInText) return this.resolve(urlInText);
    throw new BadRequestException('无法识别输入。请填写抖音号，例如 kelie329157。');
  }

  /**
   * 真实拉取用户资料（昵称 + 头像 + sec_uid）
   */
  async fetchProfile(
    id: string,
    idType: 'unique_id' | 'sec_uid',
  ): Promise<NormalizedAnchorProfile> {
    try {
      if (idType === 'unique_id') {
        const { data } = await axios.get(
          `${this.base}/api/v1/douyin/web/handler_user_profile_v2`,
          {
            params: { unique_id: id },
            timeout: 20000,
            headers: { Authorization: `Bearer ${this.apiKey}` },
          },
        );
        const profile = this.mapProfilePayload(data, id);
        if (!profile) {
          throw new BadRequestException(`未找到抖音号：${id}`);
        }
        return profile;
      }

      // sec_uid
      const { data } = await axios.get(
        `${this.base}/api/v1/douyin/web/fetch_user_profile_by_sec_uid`,
        {
          params: { sec_user_id: id },
          timeout: 20000,
          headers: { Authorization: `Bearer ${this.apiKey}` },
          validateStatus: (s) => s < 500,
        },
      );
      let profile = this.mapProfilePayload(data, id);
      if (!profile) {
        // 部分账号的备用路径
        const fallback = await axios.get(
          `${this.base}/api/v1/douyin/app/v3/handler_user_profile`,
          {
            params: { sec_user_id: id },
            timeout: 20000,
            headers: { Authorization: `Bearer ${this.apiKey}` },
            validateStatus: (s) => s < 500,
          },
        );
        profile = this.mapProfilePayload(fallback.data, id);
      }
      if (!profile) {
        throw new BadRequestException(`未找到该抖音用户：${id}`);
      }
      return profile;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      const msg = (e as Error).message || 'unknown';
      this.logger.error(`douyin fetchProfile failed: ${msg}`);
      throw new BadRequestException(`拉取抖音资料失败：${msg}`);
    }
  }

  private mapProfilePayload(payload: any, fallbackId: string): NormalizedAnchorProfile | null {
    const root = payload?.data ?? payload;
    const user =
      root?.user ??
      root?.user_info ??
      root?.userInfo ??
      root?.profile ??
      root;

    if (!user || typeof user !== 'object') return null;

    const nickname = String(user.nickname || user.nick_name || '').trim();
    const uniqueId = String(user.unique_id || user.uniqueId || fallbackId).trim();
    const secUid = String(
      user.sec_uid || user.secUid || user.sec_user_id || '',
    ).trim();

    const avatar =
      pickAvatar(user.avatar_larger) ||
      pickAvatar(user.avatar_medium) ||
      pickAvatar(user.avatar_thumb) ||
      pickAvatar(user.avatar_300x300) ||
      String(user.avatar_url || user.avatar || '');

    // 稳定主键优先 sec_uid；没有则用抖音号
    const platformUid = secUid || uniqueId || fallbackId;
    if (!platformUid) return null;
    if (!nickname && !avatar) {
      // 空壳响应视为未找到
      if (!secUid && !uniqueId) return null;
    }

    return {
      platform: 'douyin',
      platformUid,
      roomId: uniqueId || fallbackId,
      nickname: nickname || uniqueId || fallbackId,
      avatarUrl: avatar,
      profileUrl: secUid
        ? `https://www.douyin.com/user/${secUid}`
        : `https://www.douyin.com/search/${encodeURIComponent(uniqueId || fallbackId)}?type=user`,
    };
  }

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
}

function pickAvatar(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  const list = node.url_list || node.urlList;
  if (Array.isArray(list) && list[0]) return String(list[0]);
  if (node.uri) return String(node.uri);
  return '';
}
