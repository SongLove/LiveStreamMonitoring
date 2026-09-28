"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DouyinPlaywrightProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinPlaywrightProvider = void 0;
exports.parseDouyinLiveFromHtml = parseDouyinLiveFromHtml;
exports.isIncompleteDouyinProfile = isIncompleteDouyinProfile;
const common_1 = require("@nestjs/common");
const douyin_input_1 = require("./douyin-input");
const douyin_browser_pool_1 = require("./douyin-browser.pool");
const douyin_profile_parse_1 = require("./douyin-profile-parse");
const douyin_live_parse_1 = require("./douyin-live-parse");
let DouyinPlaywrightProvider = DouyinPlaywrightProvider_1 = class DouyinPlaywrightProvider {
    constructor(pool) {
        this.pool = pool;
        this.name = 'douyin-playwright';
        this.platform = 'douyin';
        this.logger = new common_1.Logger(DouyinPlaywrightProvider_1.name);
    }
    async healthCheck() {
        try {
            await Promise.resolve().then(() => __importStar(require('playwright')));
            return { ok: true, detail: 'playwright available' };
        }
        catch (e) {
            return { ok: false, detail: e.message };
        }
    }
    async resolve(input) {
        const parsed = (0, douyin_input_1.parseDouyinInput)(input);
        if (parsed.kind === 'search_keyword') {
            throw new common_1.BadRequestException('请输入抖音号（用户 ID，如 kelie329157），不支持昵称或搜索页链接。');
        }
        if (parsed.kind === 'live_id') {
            throw new common_1.BadRequestException('请使用抖音号（用户 ID）添加，暂不支持仅凭直播间号。');
        }
        if (parsed.kind === 'share_text') {
            const urlInText = input.match(/https?:\/\/[^\s]+/i)?.[0];
            if (urlInText)
                return this.resolve(urlInText);
            throw new common_1.BadRequestException('无法识别输入。请填写抖音号，例如 kelie329157。');
        }
        (0, douyin_input_1.assertDouyinUserId)(parsed.userId);
        return this.fetchViaBrowser(parsed.userId, parsed.idType);
    }
    async fetchViaBrowser(id, idType) {
        try {
            return await this.pool.withPage(async (page, context) => {
                const captured = [];
                if (idType === 'sec_uid') {
                    page = await this.openPage(context, page, captured);
                    await page.goto(`https://www.douyin.com/user/${id}`, {
                        waitUntil: 'domcontentloaded',
                    });
                    await sleep(3000);
                    const found = this.pickFromCaptured(captured, id, idType);
                    if (found)
                        return (0, douyin_profile_parse_1.toNormalizedProfile)(found, id);
                    const html = await page.content();
                    const fromHtml = (0, douyin_profile_parse_1.parseDouyinProfileFromHtml)(html, id);
                    if (fromHtml?.nickname)
                        return (0, douyin_profile_parse_1.toNormalizedProfile)(fromHtml, id);
                    throw new common_1.BadRequestException(`未找到该抖音用户：${id}`);
                }
                const liveUrl = `https://live.douyin.com/${encodeURIComponent(id)}`;
                this.logger.debug(`playwright open live first ${liveUrl}`);
                page = await this.openPage(context, page, captured);
                await page.goto(liveUrl, { waitUntil: 'domcontentloaded' });
                await sleep(4000);
                let softFallback = null;
                let found = this.pickFromCaptured(captured, id, idType);
                if (found && (0, douyin_profile_parse_1.hasAvatar)(found))
                    return (0, douyin_profile_parse_1.toNormalizedProfile)(found, id);
                if (found?.nickname)
                    softFallback = found;
                let html = await page.content();
                let fromHtml = (0, douyin_profile_parse_1.parseDouyinProfileFromHtml)(html, id);
                if (fromHtml && !(0, douyin_profile_parse_1.hasAvatar)(fromHtml)) {
                    const og = (0, douyin_profile_parse_1.extractOgImage)(html);
                    if (og)
                        fromHtml = { ...fromHtml, avatarUrl: og };
                }
                if (fromHtml?.nickname && (0, douyin_profile_parse_1.hasAvatar)(fromHtml)) {
                    return (0, douyin_profile_parse_1.toNormalizedProfile)(fromHtml, id);
                }
                if (fromHtml?.nickname)
                    softFallback = softFallback || fromHtml;
                const title = await page.title();
                const titleNick = title.match(/^(.+?)的抖音直播间/)?.[1]?.trim();
                if (titleNick && titleNick !== id) {
                    softFallback =
                        softFallback ||
                            {
                                nickname: titleNick,
                                avatarUrl: '',
                                secUid: '',
                                uniqueId: id,
                            };
                }
                const searchUrl = `https://www.douyin.com/search/${encodeURIComponent(id)}?type=user`;
                this.logger.debug(`playwright open search ${searchUrl}`);
                page = await this.openPage(context, page, captured);
                await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
                await sleep(3500);
                found = this.pickFromCaptured(captured, id, idType);
                if (found && (0, douyin_profile_parse_1.hasAvatar)(found))
                    return (0, douyin_profile_parse_1.toNormalizedProfile)(found, id);
                if (found?.nickname)
                    softFallback = softFallback || found;
                const searchHtml = await page.content();
                const fromSearchHtml = (0, douyin_profile_parse_1.parseDouyinProfileFromHtml)(searchHtml, id);
                if (fromSearchHtml?.nickname &&
                    (0, douyin_profile_parse_1.hasAvatar)(fromSearchHtml) &&
                    this.matchesTarget(fromSearchHtml, id, idType)) {
                    return (0, douyin_profile_parse_1.toNormalizedProfile)(fromSearchHtml, id);
                }
                if (fromSearchHtml?.nickname &&
                    this.matchesTarget(fromSearchHtml, id, idType)) {
                    softFallback = softFallback || fromSearchHtml;
                }
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
                    if (found && (0, douyin_profile_parse_1.hasAvatar)(found))
                        return (0, douyin_profile_parse_1.toNormalizedProfile)(found, id);
                    if (found?.nickname)
                        softFallback = softFallback || found;
                    const profileHtml = await page.content();
                    const bits = (0, douyin_profile_parse_1.parseDouyinProfileFromHtml)(profileHtml, id);
                    if (bits?.nickname && (0, douyin_profile_parse_1.hasAvatar)(bits) && this.matchesTarget(bits, id, idType)) {
                        return (0, douyin_profile_parse_1.toNormalizedProfile)(bits, id);
                    }
                    if (bits?.nickname && this.matchesTarget(bits, id, idType)) {
                        softFallback = softFallback || bits;
                    }
                }
                if (softFallback?.nickname) {
                    return (0, douyin_profile_parse_1.toNormalizedProfile)(softFallback, id);
                }
                throw new common_1.BadRequestException(`未找到抖音号：${id}`);
            });
        }
        catch (e) {
            if (e instanceof common_1.BadRequestException)
                throw e;
            const msg = e.message || 'unknown';
            this.logger.error(`playwright resolve failed: ${msg}`);
            throw new common_1.BadRequestException(`拉取抖音资料失败（Playwright）：${msg.slice(0, 120)}`);
        }
    }
    attachCapture(page, captured) {
        page.on('response', async (res) => {
            try {
                const url = res.url();
                if (!/douyin\.com|iesdouyin\.com/i.test(url))
                    return;
                if (!/user|profile|search|web\/|aweme|webcast|room/i.test(url))
                    return;
                const ct = res.headers()['content-type'] || '';
                if (!ct.includes('json') && !ct.includes('javascript'))
                    return;
                const data = await res.json().catch(() => null);
                if (data)
                    captured.push(data);
            }
            catch {
            }
        });
    }
    async openPage(context, prior, captured) {
        captured.length = 0;
        try {
            await prior.close();
        }
        catch {
        }
        const page = await context.newPage();
        page.setDefaultTimeout(this.pool.pageTimeoutMs);
        this.attachCapture(page, captured);
        return page;
    }
    pickFromCaptured(captured, id, idType) {
        let soft = null;
        for (const payload of captured) {
            const bits = (0, douyin_profile_parse_1.extractUserFromJson)(payload, id);
            if (!bits?.nickname || !this.matchesTarget(bits, id, idType))
                continue;
            if ((0, douyin_profile_parse_1.hasAvatar)(bits))
                return bits;
            if (!soft)
                soft = bits;
        }
        for (const payload of captured) {
            const bits = (0, douyin_profile_parse_1.extractUserFromJson)(payload, id);
            if (bits?.nickname &&
                idType === 'unique_id' &&
                bits.uniqueId.toLowerCase() === id.toLowerCase()) {
                if ((0, douyin_profile_parse_1.hasAvatar)(bits))
                    return bits;
                if (!soft)
                    soft = bits;
            }
        }
        return soft;
    }
    async findRealUserHref(page) {
        const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href*="/user/"]')]
            .map((a) => a.getAttribute('href') || '')
            .filter(Boolean));
        const real = hrefs.find((h) => /\/user\/[^/?#]+/i.test(h) &&
            !/\/user\/self\b/i.test(h) &&
            !/\/user\/login\b/i.test(h));
        return real || null;
    }
    matchesTarget(bits, id, idType) {
        if (idType === 'sec_uid') {
            return !bits.secUid || bits.secUid === id;
        }
        return (!bits.uniqueId || bits.uniqueId.toLowerCase() === id.toLowerCase());
    }
    async fetchStatus(uids) {
        const out = [];
        for (const uid of uids) {
            out.push(await this.probeOneLive(String(uid || '').trim()));
        }
        return out;
    }
    async probeOneLive(id) {
        const liveUrl = id
            ? `https://live.douyin.com/${encodeURIComponent(id)}`
            : '';
        const failed = () => ({
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
        if (!id)
            return failed();
        try {
            return await this.pool.withPage(async (page) => {
                const captured = [];
                page.on('response', async (res) => {
                    try {
                        const url = res.url();
                        if (!/live\.douyin\.com|webcast/i.test(url))
                            return;
                        if (!/room|enter|web\//i.test(url))
                            return;
                        const ct = res.headers()['content-type'] || '';
                        if (!ct.includes('json') && !ct.includes('javascript'))
                            return;
                        const data = await res.json().catch(() => null);
                        if (data)
                            captured.push({ url, data });
                    }
                    catch {
                    }
                });
                this.logger.debug(`playwright probe live ${liveUrl}`);
                await page.goto(liveUrl, { waitUntil: 'domcontentloaded' });
                await sleep(4000);
                const picked = (0, douyin_live_parse_1.pickDouyinLiveProbe)(captured, id);
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
        }
        catch (e) {
            this.logger.error(`playwright fetchStatus failed [${id}]: ${e.message}`);
            return failed();
        }
    }
};
exports.DouyinPlaywrightProvider = DouyinPlaywrightProvider;
exports.DouyinPlaywrightProvider = DouyinPlaywrightProvider = DouyinPlaywrightProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [douyin_browser_pool_1.DouyinBrowserPool])
], DouyinPlaywrightProvider);
function parseDouyinLiveFromHtml(html, targetWebRid) {
    if (!html)
        return null;
    const nextMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (nextMatch?.[1]) {
        try {
            const parsed = (0, douyin_live_parse_1.parseDouyinLivePayload)(JSON.parse(nextMatch[1]), targetWebRid);
            if (parsed)
                return parsed;
        }
        catch {
        }
    }
    const renderMatch = html.match(/<script[^>]*id=["']RENDER_DATA["'][^>]*>([\s\S]*?)<\/script>/i);
    if (renderMatch?.[1]) {
        try {
            const decoded = decodeURIComponent(renderMatch[1].trim());
            const parsed = (0, douyin_live_parse_1.parseDouyinLivePayload)(JSON.parse(decoded), targetWebRid);
            if (parsed)
                return parsed;
        }
        catch {
        }
    }
    const scriptJsons = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    for (const m of scriptJsons) {
        const body = (m[1] || '').trim();
        if (!body.startsWith('{') && !body.startsWith('['))
            continue;
        if (!/room_status|status_str|"status"\s*:/i.test(body))
            continue;
        try {
            const parsed = (0, douyin_live_parse_1.parseDouyinLivePayload)(JSON.parse(body), targetWebRid);
            if (parsed)
                return parsed;
        }
        catch {
        }
    }
    return null;
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function isIncompleteDouyinProfile(doc) {
    const nick = (doc.nickname || '').trim();
    const avatar = (doc.avatarUrl || '').trim();
    if (!avatar)
        return true;
    if (!nick)
        return true;
    return false;
}
//# sourceMappingURL=douyin-playwright.provider.js.map