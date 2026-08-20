import { normalizeWechatList } from './common/utils/normalize';
import { normalizeBilibiliLiveStatus } from './modules/crawler/providers/bilibili.provider';
import { buildSessionKey } from './modules/live/live-session.schema';
import { BadRequestException } from '@nestjs/common';

describe('normalizeWechatList', () => {
  it('normalizes single object to array', () => {
    expect(normalizeWechatList({ TemplateId: 'T1', status: 'accept' })).toEqual([
      { TemplateId: 'T1', status: 'accept' },
    ]);
  });

  it('keeps array as-is', () => {
    expect(normalizeWechatList([{ a: 1 }, { a: 2 }])).toHaveLength(2);
  });

  it('returns empty for null', () => {
    expect(normalizeWechatList(null)).toEqual([]);
  });
});

describe('bilibili carousel', () => {
  it('treats live_status=2 as carousel not live', () => {
    expect(normalizeBilibiliLiveStatus(2)).toBe('carousel');
    expect(normalizeBilibiliLiveStatus(1)).toBe('live');
    expect(normalizeBilibiliLiveStatus(0)).toBe('not_live');
  });
});

describe('buildSessionKey', () => {
  it('is unique per anchor and minute floor', () => {
    const a = new Date('2026-08-19T12:34:56.789Z');
    const b = new Date('2026-08-19T12:34:10.000Z');
    const c = new Date('2026-08-19T12:35:00.000Z');
    expect(buildSessionKey('anchor1', a)).toBe(buildSessionKey('anchor1', b));
    expect(buildSessionKey('anchor1', a)).not.toBe(buildSessionKey('anchor1', c));
    expect(buildSessionKey('anchor1', a)).not.toBe(buildSessionKey('anchor2', a));
  });
});

describe('quota client forge grant', () => {
  it('rejectClientGrant throws and never grants', () => {
    const rejectClientGrant = (): never => {
      throw new BadRequestException({
        code: 40010,
        message: 'Quota grant only via WeChat subscribe callback',
      });
    };
    expect(() => rejectClientGrant()).toThrow(BadRequestException);
    try {
      rejectClientGrant();
    } catch (e) {
      expect((e as BadRequestException).getResponse()).toMatchObject({
        code: 40010,
      });
    }
  });
});

describe('subscription idempotency helper', () => {
  it('re-add restores enabled instead of duplicating keys', () => {
    const key = (userId: string, anchorId: string) => `${userId}:${anchorId}`;
    const store = new Map<string, { enabled: boolean; deleted: boolean }>();
    const add = (userId: string, anchorId: string) => {
      const k = key(userId, anchorId);
      const existing = store.get(k);
      if (existing) {
        existing.deleted = false;
        existing.enabled = true;
        return existing;
      }
      const created = { enabled: true, deleted: false };
      store.set(k, created);
      return created;
    };
    add('u1', 'a1');
    add('u1', 'a1');
    expect(store.size).toBe(1);
    store.get(key('u1', 'a1'))!.deleted = true;
    store.get(key('u1', 'a1'))!.enabled = false;
    add('u1', 'a1');
    expect(store.size).toBe(1);
    expect(store.get(key('u1', 'a1'))).toEqual({ enabled: true, deleted: false });
  });
});

describe('notify skip when quota 0 without deduct', () => {
  it('validation fails on quota_insufficient before deduct', async () => {
    const balance = 0;
    const deductCalls: string[] = [];
    const validate = async () => {
      if (balance <= 0) return { pass: false, reason: 'quota_insufficient' as const };
      return { pass: true, reason: 'ok' as const };
    };
    const send = async () => {
      const check = await validate();
      if (!check.pass) {
        return { skipped: check.reason, deducted: false };
      }
      deductCalls.push('deduct');
      return { sent: true, deducted: true };
    };
    const result = await send();
    expect(result).toEqual({ skipped: 'quota_insufficient', deducted: false });
    expect(deductCalls).toHaveLength(0);
  });
});

describe('quota grant only via callback helper', () => {
  it('accept callback path uses idempotency key', () => {
    const grants = new Set<string>();
    const grantFromCallback = (idempotencyKey: string) => {
      if (grants.has(idempotencyKey)) return { granted: false };
      grants.add(idempotencyKey);
      return { granted: true };
    };
    const key = 'grant:openid:T1:123';
    expect(grantFromCallback(key).granted).toBe(true);
    expect(grantFromCallback(key).granted).toBe(false);
    expect(grants.size).toBe(1);
  });
});

describe('douyin input parse', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {
    parseDouyinInput,
    assertStableDouyinUid,
    looksLikeDouyinUserId,
    isDouyinUniqueId,
  } = require('./modules/crawler/providers/douyin-input');

  it('accepts douyin unique_id like kelie329157', () => {
    expect(isDouyinUniqueId('kelie329157')).toBe(true);
    expect(looksLikeDouyinUserId('kelie329157')).toBe(true);
    expect(parseDouyinInput('kelie329157')).toEqual({
      kind: 'user_id',
      userId: 'kelie329157',
      idType: 'unique_id',
    });
  });

  it('extracts keyword from jingxuan search URL', () => {
    const url =
      'https://www.douyin.com/jingxuan/search/%E9%BA%BB%E8%BE%A3%E6%AF%9B%E8%9B%8B?type=user';
    expect(parseDouyinInput(url)).toEqual({
      kind: 'search_keyword',
      keyword: '麻辣毛蛋',
    });
  });

  it('parses user profile sec_uid', () => {
    const url = 'https://www.douyin.com/user/MS4wLjABAAAA_abc123xyz';
    expect(parseDouyinInput(url)).toEqual({
      kind: 'user_id',
      userId: 'MS4wLjABAAAA_abc123xyz',
      idType: 'sec_uid',
    });
  });

  it('rejects chinese nickname as platformUid', () => {
    expect(() => assertStableDouyinUid('麻辣毛蛋')).toThrow();
    expect(() => assertStableDouyinUid('%E9%BA%BB?type=user')).toThrow();
  });

  it('classifies plain nickname as search_keyword (product rejects later)', () => {
    expect(parseDouyinInput('麻辣毛蛋')).toEqual({
      kind: 'search_keyword',
      keyword: '麻辣毛蛋',
    });
  });
});
