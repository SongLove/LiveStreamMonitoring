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
var KuaishouProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KuaishouProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const kuaishou_parse_1 = require("./kuaishou-parse");
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
let KuaishouProvider = KuaishouProvider_1 = class KuaishouProvider {
    constructor() {
        this.name = 'kuaishou-public';
        this.platform = 'kuaishou';
        this.logger = new common_1.Logger(KuaishouProvider_1.name);
    }
    async healthCheck() {
        try {
            const { status } = await axios_1.default.get('https://live.kuaishou.com/', {
                timeout: 5000,
                headers: { 'User-Agent': UA },
                validateStatus: () => true,
            });
            return { ok: status < 500, detail: `status ${status}` };
        }
        catch (e) {
            return { ok: false, detail: e.message };
        }
    }
    async resolve(input) {
        const id = (0, kuaishou_parse_1.extractKuaishouId)(input);
        if (!id) {
            throw new common_1.BadRequestException('请输入快手号，或直播间链接 live.kuaishou.com/u/快手号');
        }
        const parsed = await this.loadPage(id);
        if (!parsed?.nickname || parsed.nickname === id) {
            if (!parsed?.avatarUrl) {
                throw new common_1.BadRequestException(`未找到该快手号：${id}`);
            }
        }
        return {
            platform: 'kuaishou',
            platformUid: parsed.platformUid || id,
            roomId: parsed.platformUid || id,
            nickname: parsed.nickname || id,
            avatarUrl: parsed.avatarUrl,
            profileUrl: `https://live.kuaishou.com/u/${parsed.platformUid || id}`,
        };
    }
    async fetchStatus(uids) {
        const out = [];
        for (const uid of uids) {
            const id = String(uid || '').trim();
            try {
                const parsed = await this.loadPage(id);
                const living = Boolean(parsed?.living);
                out.push({
                    platform: 'kuaishou',
                    platformUid: id,
                    status: living ? 'live' : 'not_live',
                    title: '',
                    coverUrl: '',
                    liveUrl: `https://live.kuaishou.com/u/${id}`,
                    provider: this.name,
                    fetchedAt: new Date(),
                    confidence: parsed ? 0.8 : 0.2,
                });
            }
            catch (e) {
                this.logger.warn(`kuaishou probe ${id}: ${e.message}`);
                out.push({
                    platform: 'kuaishou',
                    platformUid: id,
                    status: 'probe_failed',
                    title: '',
                    coverUrl: '',
                    liveUrl: `https://live.kuaishou.com/u/${id}`,
                    provider: this.name,
                    fetchedAt: new Date(),
                    confidence: 0,
                });
            }
        }
        return out;
    }
    async loadPage(id) {
        const { data } = await axios_1.default.get(`https://live.kuaishou.com/u/${encodeURIComponent(id)}`, {
            timeout: 12000,
            responseType: 'text',
            headers: {
                'User-Agent': UA,
                Referer: 'https://live.kuaishou.com/',
                Accept: 'text/html',
            },
        });
        const html = typeof data === 'string' ? data : String(data || '');
        return (0, kuaishou_parse_1.parseKuaishouLiveHtml)(html, id);
    }
};
exports.KuaishouProvider = KuaishouProvider;
exports.KuaishouProvider = KuaishouProvider = KuaishouProvider_1 = __decorate([
    (0, common_1.Injectable)()
], KuaishouProvider);
//# sourceMappingURL=kuaishou.provider.js.map