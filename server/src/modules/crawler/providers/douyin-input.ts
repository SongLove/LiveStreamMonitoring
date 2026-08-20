import { BadRequestException } from '@nestjs/common';

export type DouyinInputKind =
  | { kind: 'search_keyword'; keyword: string }
  | { kind: 'sec_uid'; secUid: string }
  | { kind: 'live_id'; liveId: string }
  | { kind: 'share_text'; text: string };

/**
 * 解析用户粘贴的抖音输入：关键词、用户页、直播间、搜索页 URL。
 * 搜索页 URL（如 jingxuan/search/麻辣毛蛋?type=user）只能当关键词搜索，不能当 platformUid。
 */
export function parseDouyinInput(raw: string): DouyinInputKind {
  const input = (raw || '').trim();
  if (!input) {
    throw new BadRequestException('抖音输入不能为空');
  }

  // 搜索页：/jingxuan/search/<keyword>?type=user 或 /search/<keyword>
  const searchMatch = input.match(
    /douyin\.com\/(?:jingxuan\/)?search\/([^?&#/]+)/i,
  );
  if (searchMatch) {
    const keyword = safeDecode(searchMatch[1]);
    if (!keyword) throw new BadRequestException('无法从搜索链接解析关键词');
    return { kind: 'search_keyword', keyword };
  }

  // 用户主页：/user/<sec_uid>
  const userMatch = input.match(/douyin\.com\/user\/([^?&#/]+)/i);
  if (userMatch) {
    const secUid = safeDecode(userMatch[1]);
    if (!secUid || secUid.includes('?') || secUid.includes('%')) {
      throw new BadRequestException('无效的抖音用户链接');
    }
    return { kind: 'sec_uid', secUid };
  }

  // 直播间：live.douyin.com/<id>
  const liveMatch = input.match(/live\.douyin\.com\/([^?&#/]+)/i);
  if (liveMatch) {
    return { kind: 'live_id', liveId: safeDecode(liveMatch[1]) };
  }

  // 分享文案里可能夹短链
  if (/v\.douyin\.com|douyin\.com/i.test(input) && /\s/.test(input)) {
    return { kind: 'share_text', text: input };
  }

  // 纯关键词 / 抖音号 / sec_uid
  if (/^MS4wLjABAAAA/i.test(input) || /^[A-Za-z0-9_-]{20,}$/.test(input)) {
    return { kind: 'sec_uid', secUid: input };
  }

  return { kind: 'search_keyword', keyword: input };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s).trim();
  } catch {
    return s.trim();
  }
}

/** 禁止把搜索关键词伪造成 platformUid 入库 */
export function assertStableDouyinUid(uid: string): void {
  if (!uid || uid.includes('?') || uid.includes('%') || /[\u4e00-\u9fff]/.test(uid)) {
    throw new BadRequestException(
      '无法解析稳定的抖音用户 ID（sec_uid）。请配置第三方搜索，或粘贴用户主页链接。',
    );
  }
}
