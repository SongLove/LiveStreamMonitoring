"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DouyinWebProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinWebProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const provider_skip_error_1 = require("./provider-skip.error");
const douyin_input_1 = require("./douyin-input");
const douyin_live_parse_1 = require("./douyin-live-parse");
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
let DouyinWebProvider = DouyinWebProvider_1 = class DouyinWebProvider {
    constructor() {
        this.name = 'douyin-web';
        this.platform = 'douyin';
        this.logger = new common_1.Logger(DouyinWebProvider_1.name);
    }
    async healthCheck() {
        return { ok: true, detail: 'webcast room enter' };
    }
    async resolve(_input) {
        throw new provider_skip_error_1.ProviderSkippedError(this.name, 'profile resolve uses playwright');
    }
    async fetchStatus(uids) {
        const out = [];
        for (const uid of uids) {
            out.push(await this.probeOne(String(uid || '').trim()));
        }
        return out;
    }
    async probeOne(id) {
        const liveUrl = id ? `https://live.douyin.com/${encodeURIComponent(id)}` : '';
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
        if (!(0, douyin_input_1.isDouyinUniqueId)(id))
            return failed();
        try {
            const home = await axios_1.default.get(liveUrl, {
                timeout: 12000,
                responseType: 'text',
                headers: { 'User-Agent': UA, Accept: 'text/html' },
                validateStatus: () => true,
            });
            const setCookie = home.headers['set-cookie'];
            const cookie = (Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [])
                .map((c) => c.split(';')[0])
                .join('; ');
            const enter = await axios_1.default.get('https://live.douyin.com/webcast/room/web/enter/', {
                params: {
                    aid: 6383,
                    app_name: 'douyin_web',
                    live_id: 1,
                    device_platform: 'web',
                    language: 'zh-CN',
                    enter_from: 'web_live',
                    cookie_enabled: true,
                    browser_language: 'zh-CN',
                    browser_platform: 'MacIntel',
                    browser_name: 'Chrome',
                    browser_version: '122.0.0.0',
                    web_rid: id,
                },
                timeout: 12000,
                headers: {
                    'User-Agent': UA,
                    Referer: liveUrl,
                    Cookie: cookie,
                },
                validateStatus: () => true,
            });
            const parsed = (0, douyin_live_parse_1.parseDouyinLivePayload)(enter.data, id);
            if (!parsed) {
                this.logger.warn(`douyin web probe no room_status for ${id}`);
                return failed();
            }
            return {
                platform: 'douyin',
                platformUid: id,
                status: parsed.status,
                title: parsed.title,
                coverUrl: parsed.coverUrl,
                liveUrl,
                provider: this.name,
                fetchedAt: new Date(),
                confidence: parsed.confidence,
            };
        }
        catch (e) {
            this.logger.warn(`douyin web probe ${id}: ${e.message}`);
            return failed();
        }
    }
};
exports.DouyinWebProvider = DouyinWebProvider;
exports.DouyinWebProvider = DouyinWebProvider = DouyinWebProvider_1 = __decorate([
    (0, common_1.Injectable)()
], DouyinWebProvider);
//# sourceMappingURL=douyin-web.provider.js.map