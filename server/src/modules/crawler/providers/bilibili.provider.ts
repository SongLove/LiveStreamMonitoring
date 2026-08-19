import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
  NormalizedLiveStatus,
} from './provider.types';

/** Map Bilibili live_status: 1=live, 0=offline, 2=carousel (NOT live). */
export function normalizeBilibiliLiveStatus(liveStatus: number): NormalizedLiveStatus {
  if (liveStatus === 1) return 'live';
  if (liveStatus === 2) return 'carousel';
  return 'not_live';
}

@Injectable()
export class BilibiliProvider implements LiveProvider {
  readonly name = 'bilibili-official';
  readonly platform = 'bilibili' as const;
  private readonly logger = new Logger(BilibiliProvider.name);

  async healthCheck() {
    try {
      await axios.get('https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomList?page=1&page_size=1', {
        timeout: 5000,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }

  async resolve(input: string): Promise<NormalizedAnchorProfile> {
    const uid = input.replace(/\D/g, '') || input.trim();
    // Prefer room_init / user info; mock-friendly if network fails
    try {
      const { data } = await axios.get(
        `https://api.bilibili.com/x/space/acc/info?mid=${uid}`,
        { timeout: 8000, headers: { 'User-Agent': 'LiveStreamMonitoring/1.0' } },
      );
      const info = data?.data;
      if (info?.mid) {
        return {
          platform: 'bilibili',
          platformUid: String(info.mid),
          nickname: info.name || uid,
          avatarUrl: info.face || '',
          profileUrl: `https://space.bilibili.com/${info.mid}`,
          roomId: String(info.live_room?.roomid || ''),
        };
      }
    } catch (e) {
      this.logger.warn(`bilibili resolve fallback: ${(e as Error).message}`);
    }
    return {
      platform: 'bilibili',
      platformUid: uid,
      nickname: `B站用户${uid}`,
      avatarUrl: '',
      profileUrl: `https://space.bilibili.com/${uid}`,
      roomId: uid,
    };
  }

  async fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]> {
    if (!uids.length) return [];
    try {
      // Batch room status by uids via room/v1/Room/get_status_info_by_uids
      const { data } = await axios.get(
        'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
        {
          params: { uids: uids.join(',') },
          timeout: 10000,
          headers: { 'User-Agent': 'LiveStreamMonitoring/1.0' },
        },
      );
      const map = data?.data || {};
      return uids.map((uid) => {
        const row = map[uid] || map[Number(uid)];
        const liveStatus = Number(row?.live_status ?? 0);
        const status = normalizeBilibiliLiveStatus(liveStatus);
        return {
          platform: 'bilibili' as const,
          platformUid: uid,
          status: status === 'carousel' ? 'not_live' : status,
          title: row?.title || '',
          coverUrl: row?.cover_from_user || row?.keyframe || '',
          liveUrl: row?.room_id ? `https://live.bilibili.com/${row.room_id}` : '',
          online: row?.online,
          provider: this.name,
          fetchedAt: new Date(),
          confidence: 0.95,
        };
      });
    } catch (e) {
      this.logger.error(`bilibili fetchStatus failed: ${(e as Error).message}`);
      return uids.map((uid) => ({
        platform: 'bilibili' as const,
        platformUid: uid,
        status: 'probe_failed' as const,
        title: '',
        coverUrl: '',
        liveUrl: '',
        provider: this.name,
        fetchedAt: new Date(),
        confidence: 0,
      }));
    }
  }
}
