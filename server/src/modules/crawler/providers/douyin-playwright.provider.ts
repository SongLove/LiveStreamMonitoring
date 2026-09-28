import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { BrowserContext, Page } from 'playwright';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './provider.types';
import { assertDouyinUserId, parseDouyinInput } from './douyin-input';
import { DouyinBrowserPool } from './douyin-browser.pool';
import {
  extractUserFromJson,
  extractOgImage,
  hasAvatar,
  parseDouyinProfileFromHtml,
  ParsedDouyinBits,
  toNormalizedProfile,
} from './douyin-profile-parse';
import { parseDouyinLivePayload, pickDouyinLiveProbe } from './douyin-live-parse';

/**
 * Douyin via Playwright：resolve 拉昵称/头像；fetchStatus 探 live.douyin.com 开播状态。
 *
 * unique_id 策略：
 * 1) 优先打开 https://www.douyin.com/search/{id}?type=user
 * 2) 搜索页无结果（风控/空壳）时降级 https://live.douyin.com/{id}
 *    （实测 webcast/room/web/enter 可返回昵称+头像+sec_uid）
 */
@Injectable()
export class DouyinPlaywrightProvider implements LiveProvider {
  readonly name = 'douyin-playwright';
  readonly platform = 'douyin' as const;
  private readonly logger = new Logger(DouyinPlaywrightProvider.name);

  constructor(private readonly pool: DouyinBrowserPool) {}

  async healthCheck() {
    try {
      await import('playwright');
      return { ok: true, detail: 'playwright available' };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }

  async resolve(input: string): Promise<NormalizedAnchorProfile> {
    const parsed = parseDouyinInput(input);

    if (parsed.kind === 'search_keyword') {
      throw new BadRequestException(
        '请输入抖音号（用户 ID，如 kelie329157），不支持昵称或搜索页链接。',
      );
    }
    if (parsed.kind === 'live_id') {
      throw new BadRequestException(
        '请使用抖音号（用户 ID）添加，暂不支持仅凭直播间号。',
      );
    }
    if (parsed.kind === 'share_text') {
      const urlInText = input.match(/https?:\/\/[^\s]+/i)?.[0];
      if (urlInText) return this.resolve(urlInText);
      throw new BadRequestException('无法识别输入。请填写抖音号，例如 kelie329157。');
    }

    assertDouyinUserId(parsed.userId);
    return this.fetchViaBrowser(parsed.userId, parsed.idType);
  }

  private async fetchViaBrowser(
    id: string,
    idType: 'unique_id' | 'sec_uid',
  ): Promise<NormalizedAnchorProfile> {
    try {
      return await this.pool.withPage(async (page, context) => {
        const captured: unknown[] = [];

        if (idType === 'sec_uid') {
          page = await this.openPage(context, page, captured);
          await page.goto(`https://www.douyin.com/user/${id}`, {
            waitUntil: 'domcontentloaded',
          });
          await sleep(3000);
          const found = this.pickFromCaptured(captured, id, idType);
          if (found) return toNormalizedProfile(found, id);
          const html = await page.content();
          const fromHtml = parseDouyinProfileFromHtml(html, id);
          if (fromHtml?.nickname) return toNormalizedProfile(fromHtml, id);
          throw new BadRequestException(`未找到该抖音用户：${id}`);
        }

        // unique_id：优先 live.douyin.com（单页、内存占用低），失败再走搜索页。
        // 仅当已拿到头像才提前返回；无头像则继续搜索页（否则会出现「有昵称无头像」）。
        const liveUrl = `https://live.douyin.com/${encodeURIComponent(id)}`;
        this.logger.debug(`playwright open live first ${liveUrl}`);
        page = await this.openPage(context, page, captured);
        await page.goto(liveUrl, { waitUntil: 'domcontentloaded' });
        await sleep(4000);
        let softFallback: ParsedDouyinBits | null = null;
        let found = this.pickFromCaptured(captured, id, idType);
        if (found && hasAvatar(found)) return toNormalizedProfile(found, id);
        if (found?.nickname) softFallback = found;
        let html = await page.content();
        let fromHtml = parseDouyinProfileFromHtml(html, id);
        if (fromHtml && !hasAvatar(fromHtml)) {
          const og = extractOgImage(html);
          if (og) fromHtml = { ...fromHtml, avatarUrl: og };
        }
        if (fromHtml?.nickname && hasAvatar(fromHtml)) {
          return toNormalizedProfile(fromHtml, id);
        }
        if (fromHtml?.nickname) softFallback = softFallback || fromHtml;
        const title = await page.title();
        const titleNick = title.match(/^(.+?)的抖音直播间/)?.[1]?.trim();
        if (titleNick && titleNick !== id) {
          softFallback =
            softFallback ||
            ({
              nickname: titleNick,
              avatarUrl: '',
              secUid: '',
              uniqueId: id,
            } as ParsedDouyinBits);
        }

        // 1) 产品约定：用户搜索页
        const searchUrl = `https://www.douyin.com/search/${encodeURIComponent(id)}?type=user`;
        this.logger.debug(`playwright open search ${searchUrl}`);
        page = await this.openPage(context, page, captured);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        await sleep(3500);

        found = this.pickFromCaptured(captured, id, idType);
        if (found && hasAvatar(found)) return toNormalizedProfile(found, id);
        if (found?.nickname) softFallback = softFallback || found;

        const searchHtml = await page.content();
        const fromSearchHtml = parseDouyinProfileFromHtml(searchHtml, id);
        if (
          fromSearchHtml?.nickname &&
          hasAvatar(fromSearchHtml) &&
          this.matchesTarget(fromSearchHtml, id, idType)
        ) {
          return toNormalizedProfile(fromSearchHtml, id);
        }
        if (
          fromSearchHtml?.nickname &&
          this.matchesTarget(fromSearchHtml, id, idType)
        ) {
          softFallback = softFallback || fromSearchHtml;
        }

        // 真实用户主页链接（排除 /user/self）
        const profileHref = await this.findRealUserHref(page);
        if (profileHref) {
          const abs = profileHref.startsWith('http')
            ? profileHref
            : `https://www.douyin.com${profileHref}`;
          this.logger.debug(`playwright open user card ${abs}`);
          page = await this.openPage(context, page, captured);
          await page.goto(abs, { waitUntil: 'domcontentloaded' });
          await sleep(2500);
          found = this.pickFromCaptured(captured, id, idType);
          if (found && hasAvatar(found)) return toNormalizedProfile(found, id);
          if (found?.nickname) softFallback = softFallback || found;
          const profileHtml = await page.content();
          const bits = parseDouyinProfileFromHtml(profileHtml, id);
          if (bits?.nickname && hasAvatar(bits) && this.matchesTarget(bits, id, idType)) {
            return toNormalizedProfile(bits, id);
          }
          if (bits?.nickname && this.matchesTarget(bits, id, idType)) {
            softFallback = softFallback || bits;
          }
        }

        if (softFallback?.nickname) {
          return toNormalizedProfile(softFallback, id);
        }
        throw new BadRequestException(`未找到抖音号：${id}`);
      });
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      const msg = (e as Error).message || 'unknown';
      this.logger.error(`playwright resolve failed: ${msg}`);
      throw new BadRequestException(
        `拉取抖音资料失败（Playwright）：${msg.slice(0, 120)}`,
      );
    }
  }

  private attachCapture(page: Page, captured: unknown[]) {
    page.on('response', async (res) => {
      try {
        const url = res.url();
        if (!/douyin\.com|iesdouyin\.com/i.test(url)) return;
        if (!/user|profile|search|web\/|aweme|webcast|room/i.test(url)) return;
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json') && !ct.includes('javascript')) return;
        const data = await res.json().catch(() => null);
        if (data) captured.push(data);
      } catch {
        /* ignore */
      }
    });
  }

  /** Close prior tab and open a fresh one to shed renderer memory between heavy navigations. */
  private async openPage(
    context: BrowserContext,
    prior: Page,
    captured: unknown[],
  ): Promise<Page> {
    captured.length = 0;
    try {
      await prior.close();
    } catch {
      /* ignore */
    }
    const page = await context.newPage();
    page.setDefaultTimeout(this.pool.pageTimeoutMs);
    this.attachCapture(page, captured);
    return page;
  }

  private pickFromCaptured(
    captured: unknown[],
    id: string,
    idType: 'unique_id' | 'sec_uid',
  ): ParsedDouyinBits | null {
    let soft: ParsedDouyinBits | null = null;
    for (const payload of captured) {
      const bits = extractUserFromJson(payload, id);
      if (!bits?.nickname || !this.matchesTarget(bits, id, idType)) continue;
      if (hasAvatar(bits)) return bits;
      if (!soft) soft = bits;
    }
    for (const payload of captured) {
      const bits = extractUserFromJson(payload, id);
      if (
        bits?.nickname &&
        idType === 'unique_id' &&
        bits.uniqueId.toLowerCase() === id.toLowerCase()
      ) {
        if (hasAvatar(bits)) return bits;
        if (!soft) soft = bits;
      }
    }
    return soft;
  }

  private async findRealUserHref(page: Page): Promise<string | null> {
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href*="/user/"]')]
        .map((a) => a.getAttribute('href') || '')
        .filter(Boolean),
    );
    const real = hrefs.find(
      (h) =>
        /\/user\/[^/?#]+/i.test(h) &&
        !/\/user\/self\b/i.test(h) &&
        !/\/user\/login\b/i.test(h),
    );
    return real || null;
  }

  private matchesTarget(
    bits: { uniqueId: string; secUid: string },
    id: string,
    idType: 'unique_id' | 'sec_uid',
  ): boolean {
    if (idType === 'sec_uid') {
      return !bits.secUid || bits.secUid === id;
    }
    return (
      !bits.uniqueId || bits.uniqueId.toLowerCase() === id.toLowerCase()
    );
  }

  /**
   * 按直播间 web_rid（抖音号 / roomId）探测开播。
   * 调度侧应传入 roomId 优先；结果 platformUid 回填为入参 id，便于双键匹配。
   */
  async fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]> {
    const out: NormalizedLiveResult[] = [];
    for (const uid of uids) {
      out.push(await this.probeOneLive(String(uid || '').trim()));
    }
    return out;
  }

  private async probeOneLive(id: string): Promise<NormalizedLiveResult> {
    const liveUrl = id
      ? `https://live.douyin.com/${encodeURIComponent(id)}`
      : '';
    const failed = (): NormalizedLiveResult => ({
      platform: 'douyin',
      platformUid: id,
      status: 'probe_failed',
      title: '',
      coverUrl: '',
      liveUrl,
      provider: this.name,
      fetchedAt: new Date(),
      confidence: 0,
    });

    if (!id) return failed();

    try {
      return await this.pool.withPage(async (page) => {
        const captured: { url: string; data: unknown }[] = [];
        page.on('response', async (res) => {
          try {
            const url = res.url();
            if (!/live\.douyin\.com|webcast/i.test(url)) return;
            if (!/room|enter|web\//i.test(url)) return;
            const ct = res.headers()['content-type'] || '';
            if (!ct.includes('json') && !ct.includes('javascript')) return;
            const data = await res.json().catch(() => null);
            if (data) captured.push({ url, data });
          } catch {
            /* ignore */
          }
        });

        this.logger.debug(`playwright probe live ${liveUrl}`);
        await page.goto(liveUrl, { waitUntil: 'domcontentloaded' });
        await sleep(4000);

        const picked = pickDouyinLiveProbe(captured, id);
        if (picked) {
          return {
            platform: 'douyin',
            platformUid: id,
            status: picked.status,
            title: picked.title,
            coverUrl: picked.coverUrl,
            liveUrl,
            provider: this.name,
            fetchedAt: new Date(),
            confidence: picked.confidence,
          };
        }

        const html = await page.content();
        const fromHtml = parseDouyinLiveFromHtml(html, id);
        if (fromHtml && fromHtml.status !== 'probe_failed') {
          return {
            platform: 'douyin',
            platformUid: id,
            status: fromHtml.status,
            title: fromHtml.title,
            coverUrl: fromHtml.coverUrl,
            liveUrl,
            provider: this.name,
            fetchedAt: new Date(),
            confidence: fromHtml.confidence,
          };
        }

        this.logger.warn(`playwright probe no room_status for ${id}`);
        return failed();
      });
    } catch (e) {
      this.logger.error(
        `playwright fetchStatus failed [${id}]: ${(e as Error).message}`,
      );
      return failed();
    }
  }
}

/** 从直播页 HTML 抽 SSR JSON 再解析开播状态 */
export function parseDouyinLiveFromHtml(html: string, targetWebRid?: string) {
  if (!html) return null;

  const nextMatch = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (nextMatch?.[1]) {
    try {
      const parsed = parseDouyinLivePayload(JSON.parse(nextMatch[1]), targetWebRid);
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
      const parsed = parseDouyinLivePayload(JSON.parse(decoded), targetWebRid);
      if (parsed) return parsed;
    } catch {
      /* ignore */
    }
  }

  const scriptJsons = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of scriptJsons) {
    const body = (m[1] || '').trim();
    if (!body.startsWith('{') && !body.startsWith('[')) continue;
    if (!/room_status|status_str|"status"\s*:/i.test(body)) continue;
    try {
      const parsed = parseDouyinLivePayload(JSON.parse(body), targetWebRid);
      if (parsed) return parsed;
    } catch {
      /* ignore */
    }
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 占位资料：昵称≈抖音号且无头像（历史假解析） */
export function isIncompleteDouyinProfile(doc: {
  nickname?: string;
  avatarUrl?: string;
  platformUid?: string;
  roomId?: string;
}): boolean {
  const nick = (doc.nickname || '').trim();
  const avatar = (doc.avatarUrl || '').trim();
  // 无头像一律视为不完整：搜索会重新 resolve（避免 live 页仅标题昵称入库后永久无头像）
  if (!avatar) return true;
  if (!nick) return true;
  return false;
}
