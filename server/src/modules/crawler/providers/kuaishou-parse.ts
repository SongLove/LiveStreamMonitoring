export type ParsedKuaishouProfile = {
  platformUid: string;
  nickname: string;
  avatarUrl: string;
  /** 房间级 isLiving；author.living 不可靠，不以它为准 */
  living: boolean;
};

/** 从直播间链接或裸 ID 取出 principalId（快手号） */
export function extractKuaishouId(raw: string): string {
  const input = (raw || '').trim();
  if (!input) return '';
  const urlMatch = input.match(
    /live\.kuaishou\.com\/(?:u|profile)\/([A-Za-z0-9_-]+)/i,
  );
  if (urlMatch) return urlMatch[1];
  const share = input.match(/v\.kuaishou\.com\/([A-Za-z0-9]+)/i);
  if (share) return share[1];
  if (/^[\u4e00-\u9fff]/.test(input)) return '';
  if (/^[A-Za-z0-9_-]{2,64}$/.test(input)) return input;
  return '';
}

function decodeJsString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`) as string;
  } catch {
    return raw.replace(/\\u002F/gi, '/').replace(/\\n/g, '\n');
  }
}

function asHttp(raw: string): string {
  const s = decodeJsString(raw).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  return '';
}

/**
 * 解析 live.kuaishou.com/u/{id} 的 SSR HTML。
 * 公开页无需登录 Cookie（参考 go-olive/tv、live_api/liveroom 页面内嵌状态）。
 */
export function parseKuaishouLiveHtml(
  html: string,
  fallbackId = '',
): ParsedKuaishouProfile | null {
  if (!html) return null;

  const author = html.match(
    /"id":"([A-Za-z0-9_-]+)","name":"((?:\\.|[^"\\])*)","description":"(?:\\.|[^"\\])*","avatar":"((?:\\.|[^"\\])*)"(?:,"sex":"[^"]*")?,"living":(true|false)/,
  );

  let platformUid = author?.[1] || fallbackId;
  let nickname = author ? decodeJsString(author[2]) : '';
  let avatarUrl = author ? asHttp(author[3]) : '';

  if (!nickname) {
    const nameEl = html.match(/class="name"[^>]*>([^<]+)</);
    if (nameEl) nickname = nameEl[1].trim();
  }
  if (!avatarUrl) {
    const img = html.match(/class="avatar"\s+src="(https?:\/\/[^"]+)"/);
    if (img) avatarUrl = img[1];
  }
  if (!nickname) {
    const title = html.match(/<title[^>]*>([^<]+)-快手直播<\/title>/);
    if (title) nickname = title[1].trim();
  }

  const roomFlag = html.match(/"isLiving":(true|false)/);
  const hasPlayUrl = /"playUrls"[\s\S]{0,800}?"url":"https?:/.test(html);
  const living = roomFlag?.[1] === 'true' || (!roomFlag && hasPlayUrl);

  if (!platformUid && !nickname) return null;
  return {
    platformUid: platformUid || fallbackId,
    nickname: nickname || platformUid || fallbackId,
    avatarUrl,
    living,
  };
}
