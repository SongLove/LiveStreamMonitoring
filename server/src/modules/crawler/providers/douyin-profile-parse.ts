import { NormalizedAnchorProfile } from './provider.types';

export type ParsedDouyinBits = {
  nickname: string;
  avatarUrl: string;
  secUid: string;
  uniqueId: string;
};

/** 只接受可直接给小程序 <image> 用的绝对 URL */
function asHttpUrl(raw: unknown): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  return '';
}

function pickAvatar(node: unknown): string {
  if (!node) return '';
  if (typeof node === 'string') return asHttpUrl(node);
  if (typeof node !== 'object') return '';
  const o = node as Record<string, unknown>;
  const list = o.url_list || o.urlList;
  if (Array.isArray(list)) {
    for (const item of list) {
      const url = asHttpUrl(item);
      if (url) return url;
    }
  }
  return asHttpUrl(o.uri) || asHttpUrl(o.url);
}

function fromUserObject(user: Record<string, unknown>, fallbackId: string): ParsedDouyinBits | null {
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
    pickAvatar(user.avatar_168x168) ||
    pickAvatar(user.avatar_uri) ||
    pickAvatar(user.AvatarThumb) ||
    asHttpUrl(user.avatar_url) ||
    asHttpUrl(user.avatar) ||
    asHttpUrl(user.avatar_uri);

  if (!nickname && !secUid && !uniqueId) return null;
  return { nickname, avatarUrl: avatar, secUid, uniqueId };
}

/** Walk nested JSON looking for a user-like object with nickname + id. Prefer ones with avatar. */
export function extractUserFromJson(payload: unknown, fallbackId = ''): ParsedDouyinBits | null {
  if (!payload || typeof payload !== 'object') return null;

  const queue: unknown[] = [payload];
  const seen = new Set<unknown>();
  let bestWithoutAvatar: ParsedDouyinBits | null = null;

  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
    seen.add(cur);

    const o = cur as Record<string, unknown>;
    const hasNick = Boolean(o.nickname || o.nick_name);
    const hasId = Boolean(o.sec_uid || o.secUid || o.unique_id || o.uniqueId);
    if (hasNick && hasId) {
      const parsed = fromUserObject(o, fallbackId);
      if (parsed?.nickname) {
        if (hasAvatar(parsed)) return parsed;
        if (!bestWithoutAvatar) bestWithoutAvatar = parsed;
      }
    }

    for (const v of Object.values(o)) {
      if (v && typeof v === 'object') queue.push(v);
    }
  }
  return bestWithoutAvatar;
}

/**
 * Parse Douyin HTML / embedded SSR scripts for user profile bits.
 * Supports __NEXT_DATA__, RENDER_DATA (URI-encoded JSON), and raw JSON blobs.
 */
export function parseDouyinProfileFromHtml(
  html: string,
  fallbackId = '',
): ParsedDouyinBits | null {
  if (!html) return null;

  const nextMatch = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (nextMatch?.[1]) {
    try {
      const parsed = extractUserFromJson(JSON.parse(nextMatch[1]), fallbackId);
      if (parsed) return parsed;
    } catch {
      /* ignore */
    }
  }

  const renderMatch = html.match(
    /<script[^>]*id=["']RENDER_DATA["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (renderMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(renderMatch[1].trim());
      const parsed = extractUserFromJson(JSON.parse(decoded), fallbackId);
      if (parsed) return parsed;
    } catch {
      /* ignore */
    }
  }

  // Fallback: any large JSON script that looks like user payload
  const scriptJsons = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of scriptJsons) {
    const body = (m[1] || '').trim();
    if (!body.startsWith('{') && !body.startsWith('[')) continue;
    if (!/nickname|sec_uid|unique_id/i.test(body)) continue;
    try {
      const parsed = extractUserFromJson(JSON.parse(body), fallbackId);
      if (parsed) return parsed;
    } catch {
      /* ignore */
    }
  }

  return null;
}

export function toNormalizedProfile(
  bits: ParsedDouyinBits,
  fallbackId: string,
): NormalizedAnchorProfile {
  const uniqueId = bits.uniqueId || fallbackId;
  const platformUid = bits.secUid || uniqueId || fallbackId;
  return {
    platform: 'douyin',
    platformUid,
    roomId: uniqueId,
    nickname: bits.nickname || uniqueId,
    avatarUrl: bits.avatarUrl || '',
    profileUrl: bits.secUid
      ? `https://www.douyin.com/user/${bits.secUid}`
      : `https://www.douyin.com/search/${encodeURIComponent(uniqueId)}?type=user`,
  };
}

/** True when profile carries a non-empty avatar URL. */
export function hasAvatar(bits: { avatarUrl?: string } | null | undefined): boolean {
  return Boolean(bits?.avatarUrl?.trim());
}

/** Pull og:image from HTML as avatar fallback (live pages often expose it). */
export function extractOgImage(html: string): string {
  if (!html) return '';
  const m =
    html.match(
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    ) ||
    html.match(
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    );
  const url = (m?.[1] || '').trim();
  if (!url || url.startsWith('data:')) return '';
  return url;
}
