import { NormalizedLiveStatus } from './provider.types';

export type ParsedDouyinLive = {
  status: NormalizedLiveStatus;
  title: string;
  coverUrl: string;
  confidence: number;
};

function pickCover(node: unknown): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node !== 'object') return '';
  const o = node as Record<string, unknown>;
  const list = o.url_list || o.urlList;
  if (Array.isArray(list) && list[0]) return String(list[0]);
  if (o.uri) return String(o.uri);
  return '';
}

/**
 * 从 webcast/room/web/enter 等 JSON 解析开播状态。
 *
 * 约定（与 TikHub / DouyinLiveWebFetcher 一致）：
 * - data.room_status === 0 → 开播
 * - data.room_status === 2 → 未开播/已结束
 *
 * 页面 SSR（roomStore）另一套：
 * - room.status / status_str === 2 → 开播
 */
export function parseDouyinLivePayload(payload: unknown): ParsedDouyinLive | null {
  if (!payload || typeof payload !== 'object') return null;

  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;

  // 1) enter API：优先 room_status
  if ('room_status' in data || 'roomStatus' in data) {
    const rs = Number(data.room_status ?? data.roomStatus);
    if (!Number.isNaN(rs)) {
      const roomList = Array.isArray(data.data) ? data.data[0] : data.room;
      const room =
        roomList && typeof roomList === 'object'
          ? (roomList as Record<string, unknown>)
          : {};
      const title = String(room.title || data.title || '').trim();
      const cover =
        pickCover(room.cover) ||
        pickCover((room as any).cover_url) ||
        '';
      return {
        status: rs === 0 ? 'live' : 'not_live',
        title,
        coverUrl: cover,
        confidence: 0.9,
      };
    }
  }

  // 2) 深度扫描 room 对象
  const found = findRoomBits(payload);
  if (found) return found;

  return null;
}

function findRoomBits(payload: unknown): ParsedDouyinLive | null {
  const queue: unknown[] = [payload];
  const seen = new Set<unknown>();
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
    seen.add(cur);
    const o = cur as Record<string, unknown>;

    if ('room_status' in o || 'roomStatus' in o) {
      const rs = Number(o.room_status ?? o.roomStatus);
      if (!Number.isNaN(rs)) {
        return {
          status: rs === 0 ? 'live' : 'not_live',
          title: String(o.title || '').trim(),
          coverUrl: pickCover(o.cover) || pickCover(o.cover_url) || '',
          confidence: 0.9,
        };
      }
    }

    // roomStore: status_str "2" / status 2 = live
    const hasTitle = typeof o.title === 'string' && o.title.length > 0;
    const statusStr = o.status_str ?? o.statusStr;
    const statusNum = o.status;
    if (hasTitle && (statusStr !== undefined || statusNum !== undefined)) {
      const liveByStr = String(statusStr) === '2';
      const liveByNum = Number(statusNum) === 2;
      if (liveByStr || liveByNum || String(statusStr) === '4' || Number(statusNum) === 4) {
        return {
          status: liveByStr || liveByNum ? 'live' : 'not_live',
          title: String(o.title).trim(),
          coverUrl: pickCover(o.cover) || '',
          confidence: 0.85,
        };
      }
    }

    for (const v of Object.values(o)) {
      if (v && typeof v === 'object') queue.push(v);
    }
  }
  return null;
}
