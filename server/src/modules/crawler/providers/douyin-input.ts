import { BadRequestException } from '@nestjs/common';

export type DouyinInputKind =
  | { kind: 'search_keyword'; keyword: string }
  | { kind: 'user_id'; userId: string; idType: 'unique_id' | 'sec_uid' }
  | { kind: 'live_id'; liveId: string }
  | { kind: 'share_text'; text: string };

/**
 * 抖音号（用户展示 ID）例如 kelie329157 —— 用户日常说的「用户 ID」。
 * sec_uid（MS4wLjABAAAA...）是内部稳定主键，主页链接里常见，也接受。
 */
export function isDouyinUniqueId(raw: string): boolean {
  const s = (raw || '').trim();
  // 排除明显的 sec_uid
  if (/^MS4wLjABAAAA/i.test(s)) return false;
  // 抖音号：字母数字下划线/点，长度 3~30，不允许中文与空格
  return /^[a-zA-Z0-9._]{3,30}$/.test(s);
}

export function isDouyinSecUid(raw: string): boolean {
  const s = (raw || '').trim();
  return /^MS4wLjABAAAA[A-Za-z0-9_-]+$/i.test(s) || /^[A-Za-z0-9_-]{24,}$/.test(s);
}

/** 是否可作为抖音「用户 ID」输入（抖音号或 sec_uid） */
export function looksLikeDouyinUserId(raw: string): boolean {
  const s = (raw || '').trim();
  return isDouyinUniqueId(s) || isDouyinSecUid(s);
}

/**
 * 解析用户粘贴的抖音输入。
 * 优先识别抖音号（如 kelie329157）与主页链接中的 ID。
 */
export function parseDouyinInput(raw: string): DouyinInputKind {
  const input = (raw || '').trim();
  if (!input) {
    throw new BadRequestException('抖音输入不能为空');
  }

  // 搜索页不能当用户 ID
  const searchMatch = input.match(
    /douyin\.com\/(?:jingxuan\/)?search\/([^?&#/]+)/i,
  );
  if (searchMatch) {
    const keyword = safeDecode(searchMatch[1]);
    if (!keyword) throw new BadRequestException('无法从搜索链接解析关键词');
    return { kind: 'search_keyword', keyword };
  }

  // 用户主页：/user/<id> —— 可能是 sec_uid，也可能是其它路径段
  const userMatch = input.match(/douyin\.com\/user\/([^?&#/]+)/i);
  if (userMatch) {
    const id = safeDecode(userMatch[1]);
    if (!id || id.includes('?') || id.includes('%') || /[\u4e00-\u9fff]/.test(id)) {
      throw new BadRequestException('无效的抖音用户链接');
    }
    if (isDouyinSecUid(id)) {
      return { kind: 'user_id', userId: id, idType: 'sec_uid' };
    }
    if (isDouyinUniqueId(id)) {
      return { kind: 'user_id', userId: id, idType: 'unique_id' };
    }
    // 其它较长 token 仍当用户 ID 收下
    return { kind: 'user_id', userId: id, idType: 'sec_uid' };
  }

  const liveMatch = input.match(/live\.douyin\.com\/([^?&#/]+)/i);
  if (liveMatch) {
    return { kind: 'live_id', liveId: safeDecode(liveMatch[1]) };
  }

  if (/v\.douyin\.com|douyin\.com/i.test(input) && /\s/.test(input)) {
    return { kind: 'share_text', text: input };
  }

  if (isDouyinSecUid(input)) {
    return { kind: 'user_id', userId: input, idType: 'sec_uid' };
  }
  if (isDouyinUniqueId(input)) {
    return { kind: 'user_id', userId: input, idType: 'unique_id' };
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

/** 直播间 web_rid 只能是抖音号。昵称和 sec_uid 打开 live.douyin.com 会超时。 */
export function douyinLiveWebRid(anchor: {
  roomId?: string;
  platformUid?: string;
}): string {
  const roomId = String(anchor.roomId || '').trim();
  if (isDouyinUniqueId(roomId)) return roomId;
  const platformUid = String(anchor.platformUid || '').trim();
  if (isDouyinUniqueId(platformUid)) return platformUid;
  return '';
}

export function assertDouyinUserId(uid: string): void {
  if (!looksLikeDouyinUserId(uid)) {
    throw new BadRequestException(
      '无效的抖音用户 ID。请输入抖音号（如 kelie329157），不支持昵称。',
    );
  }
}

/** @deprecated 使用 assertDouyinUserId */
export function assertStableDouyinUid(uid: string): void {
  assertDouyinUserId(uid);
}
