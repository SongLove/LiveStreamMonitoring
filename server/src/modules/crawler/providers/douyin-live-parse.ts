import { NormalizedLiveStatus } from './provider.types';

export type ParsedDouyinLive = {
  status: NormalizedLiveStatus;
  title: string;
  coverUrl: string;
  confidence: number;
};

export type DouyinLiveProbeSource = {
  url?: string;
  data: unknown;
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

function normId(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '');
}

/** 判断 room/owner 是否属于当前探测的抖音号（web_rid / unique_id） */
export function roomMatchesTarget(
  node: Record<string, unknown>,
  targetWebRid?: string,
): boolean {
  if (!targetWebRid) return true;
  const target = normId(targetWebRid);
  if (!target) return true;

  const owner =
    node.owner && typeof node.owner === 'object'
      ? (node.owner as Record<string, unknown>)
      : null;

  const ids = [
    node.web_rid,
    node.webRid,
    node.unique_id,
    node.uniqueId,
    owner?.unique_id,
    owner?.uniqueId,
    owner?.display_id,
    owner?.displayId,
  ]
    .map(normId)
    .filter(Boolean);

  return ids.includes(target);
}

function isEnterApiUrl(url?: string): boolean {
  return Boolean(url && /room\/web\/enter|webcast\/room\/web\/enter/i.test(url));
}

function extractPrimaryRoom(data: Record<string, unknown>): Record<string, unknown> {
  const roomList = Array.isArray(data.data) ? data.data[0] : data.room;
  if (roomList && typeof roomList === 'object') {
    return roomList as Record<string, unknown>;
  }
  return {};
}

/**
 * 从 webcast/room/web/enter 等 JSON 解析开播状态。
 *
 * 约定（与 TikHub / DouyinLiveWebFetcher 一致）：
 * - data.room_status === 0 → 开播
 * - data.room_status === 2 → 未开播/已结束
 *
 * targetWebRid：探测 live.douyin.com/{id} 时传入，避免把推荐位其他主播误判为 live。
 */
export function parseDouyinLivePayload(
  payload: unknown,
  targetWebRid?: string,
): ParsedDouyinLive | null {
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
      const room = extractPrimaryRoom(data);
      const isLive = rs === 0;
      if (isLive && targetWebRid && !roomMatchesTarget(room, targetWebRid)) {
        return null;
      }
      const title = String(room.title || data.title || '').trim();
      const cover =
        pickCover(room.cover) ||
        pickCover((room as Record<string, unknown>).cover_url) ||
        '';
      return {
        status: isLive ? 'live' : 'not_live',
        title,
        coverUrl: cover,
        confidence: 0.9,
      };
    }
  }

  // 2) 深度扫描 room 对象（必须匹配 targetWebRid）
  return findRoomBits(payload, targetWebRid);
}

function findRoomBits(
  payload: unknown,
  targetWebRid?: string,
): ParsedDouyinLive | null {
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
        const isLive = rs === 0;
        if (targetWebRid && !roomMatchesTarget(o, targetWebRid)) {
          /* skip other anchors' rooms */
        } else {
          return {
            status: isLive ? 'live' : 'not_live',
            title: String(o.title || '').trim(),
            coverUrl: pickCover(o.cover) || pickCover(o.cover_url) || '',
            confidence: 0.9,
          };
        }
      }
    }

    // roomStore: status_str "2" / status 2 = live（必须匹配主播，防推荐位误判）
    const hasTitle = typeof o.title === 'string' && o.title.length > 0;
    const statusStr = o.status_str ?? o.statusStr;
    const statusNum = o.status;
    if (hasTitle && (statusStr !== undefined || statusNum !== undefined)) {
      const liveByStr = String(statusStr) === '2';
      const liveByNum = Number(statusNum) === 2;
      const isLive = liveByStr || liveByNum;
      const isOfflineByFour = String(statusStr) === '4' || Number(statusNum) === 4;
      if (isLive || isOfflineByFour) {
        if (targetWebRid && !roomMatchesTarget(o, targetWebRid)) {
          /* skip */
        } else {
          return {
            status: isLive ? 'live' : 'not_live',
            title: String(o.title).trim(),
            coverUrl: pickCover(o.cover) || '',
            confidence: 0.85,
          };
        }
      }
    }

    for (const v of Object.values(o)) {
      if (v && typeof v === 'object') queue.push(v);
    }
  }
  return null;
}

/** 从多条拦截 JSON 中选出最可信的一条（enter API 优先，not_live 优先于误判 live） */
export function pickDouyinLiveProbe(
  sources: DouyinLiveProbeSource[],
  targetWebRid: string,
): ParsedDouyinLive | null {
  type Scored = ParsedDouyinLive & { score: number };
  const scored: Scored[] = [];

  for (const src of sources) {
    const parsed = parseDouyinLivePayload(src.data, targetWebRid);
    if (!parsed) continue;
    let score = parsed.confidence;
    if (isEnterApiUrl(src.url)) score += 2;
    if (parsed.status === 'not_live') score += 0.5;
    scored.push({ ...parsed, score });
  }

  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  return {
    status: best.status,
    title: best.title,
    coverUrl: best.coverUrl,
    confidence: best.confidence,
  };
}
