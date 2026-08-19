import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './provider.types';

@Injectable()
export class DouyinThirdPartyProvider implements LiveProvider {
  readonly name = 'douyin-third-party';
  readonly platform = 'douyin' as const;
  private readonly logger = new Logger(DouyinThirdPartyProvider.name);

  constructor(private readonly config: ConfigService) {}

  async healthCheck() {
    const base = this.config.get<string>('douyin.thirdPartyBaseUrl');
    if (!base) return { ok: true, detail: 'mock mode' };
    try {
      await axios.get(base, { timeout: 5000 });
      return { ok: true };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }

  async resolve(input: string): Promise<NormalizedAnchorProfile> {
    const uid = input.trim().replace(/.*\//, '');
    return {
      platform: 'douyin',
      platformUid: uid,
      nickname: `抖音用户${uid.slice(0, 8)}`,
      avatarUrl: '',
      profileUrl: `https://www.douyin.com/user/${uid}`,
    };
  }

  /**
   * Douyin room status 0 often means live — normalize inside provider.
   */
  async fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]> {
    const base = this.config.get<string>('douyin.thirdPartyBaseUrl');
    const apiKey = this.config.get<string>('douyin.thirdPartyApiKey');
    if (!base || !apiKey) {
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
        `${base}/douyin/live/batch`,
        { uids },
        {
          timeout: 15000,
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );
      const rows = data?.data || data || [];
      return uids.map((uid) => {
        const row = Array.isArray(rows)
          ? rows.find((r: any) => String(r.uid || r.sec_uid) === uid)
          : rows[uid];
        // room_status === 0 => live (platform-specific)
        const roomStatus = row?.room_status ?? row?.status;
        const isLive = roomStatus === 0 || roomStatus === 'live' || roomStatus === 2;
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
