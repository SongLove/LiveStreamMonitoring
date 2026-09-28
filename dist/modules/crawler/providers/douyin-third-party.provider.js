"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DouyinThirdPartyProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinThirdPartyProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const douyin_input_1 = require("./douyin-input");
const provider_skip_error_1 = require("./provider-skip.error");
let DouyinThirdPartyProvider = DouyinThirdPartyProvider_1 = class DouyinThirdPartyProvider {
    constructor(config) {
        this.config = config;
        this.name = 'douyin-third-party';
        this.platform = 'douyin';
        this.logger = new common_1.Logger(DouyinThirdPartyProvider_1.name);
    }
    get base() {
        return (this.config.get('douyin.thirdPartyBaseUrl') || '').replace(/\/$/, '');
    }
    get apiKey() {
        return this.config.get('douyin.thirdPartyApiKey') || '';
    }
    get configured() {
        return Boolean(this.base && this.apiKey);
    }
    requireConfiguredOrSkip(action) {
        if (!this.configured) {
            throw new provider_skip_error_1.ProviderSkippedError(this.name, `${action}: DOUYIN_THIRD_PARTY_* 未配置`);
        }
    }
    async healthCheck() {
        if (!this.configured)
            return { ok: true, detail: 'third-party not configured' };
        try {
            await axios_1.default.get(this.base, {
                timeout: 5000,
                headers: { Authorization: `Bearer ${this.apiKey}` },
                validateStatus: () => true,
            });
            return { ok: true };
        }
        catch (e) {
            return { ok: false, detail: e.message };
        }
    }
    async searchUsers(_keyword) {
        throw new common_1.BadRequestException('抖音请按用户 ID（抖音号，如 kelie329157）搜索，不支持昵称。');
    }
    async resolve(input) {
        const parsed = (0, douyin_input_1.parseDouyinInput)(input);
        if (parsed.kind === 'search_keyword') {
            throw new common_1.BadRequestException('请输入抖音号（用户 ID，如 kelie329157），不支持昵称或搜索页链接。');
        }
        if (parsed.kind === 'user_id') {
            (0, douyin_input_1.assertDouyinUserId)(parsed.userId);
            this.requireConfiguredOrSkip('查询抖音主播资料');
            return this.fetchProfile(parsed.userId, parsed.idType);
        }
        if (parsed.kind === 'live_id') {
            throw new common_1.BadRequestException('请使用抖音号（用户 ID）添加，暂不支持仅凭直播间号。');
        }
        const urlInText = input.match(/https?:\/\/[^\s]+/i)?.[0];
        if (urlInText)
            return this.resolve(urlInText);
        throw new common_1.BadRequestException('无法识别输入。请填写抖音号，例如 kelie329157。');
    }
    async fetchProfile(id, idType) {
        try {
            if (idType === 'unique_id') {
                const { data } = await axios_1.default.get(`${this.base}/api/v1/douyin/web/handler_user_profile_v2`, {
                    params: { unique_id: id },
                    timeout: 20000,
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                });
                const profile = this.mapProfilePayload(data, id);
                if (!profile) {
                    throw new common_1.BadRequestException(`未找到抖音号：${id}`);
                }
                return profile;
            }
            const { data } = await axios_1.default.get(`${this.base}/api/v1/douyin/web/fetch_user_profile_by_sec_uid`, {
                params: { sec_user_id: id },
                timeout: 20000,
                headers: { Authorization: `Bearer ${this.apiKey}` },
                validateStatus: (s) => s < 500,
            });
            let profile = this.mapProfilePayload(data, id);
            if (!profile) {
                const fallback = await axios_1.default.get(`${this.base}/api/v1/douyin/app/v3/handler_user_profile`, {
                    params: { sec_user_id: id },
                    timeout: 20000,
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                    validateStatus: (s) => s < 500,
                });
                profile = this.mapProfilePayload(fallback.data, id);
            }
            if (!profile) {
                throw new common_1.BadRequestException(`未找到该抖音用户：${id}`);
            }
            return profile;
        }
        catch (e) {
            if (e instanceof common_1.BadRequestException)
                throw e;
            const msg = e.message || 'unknown';
            this.logger.error(`douyin fetchProfile failed: ${msg}`);
            throw new common_1.BadRequestException(`拉取抖音资料失败：${msg}`);
        }
    }
    mapProfilePayload(payload, fallbackId) {
        const root = payload?.data ?? payload;
        const user = root?.user ??
            root?.user_info ??
            root?.userInfo ??
            root?.profile ??
            root;
        if (!user || typeof user !== 'object')
            return null;
        const nickname = String(user.nickname || user.nick_name || '').trim();
        const uniqueId = String(user.unique_id || user.uniqueId || fallbackId).trim();
        const secUid = String(user.sec_uid || user.secUid || user.sec_user_id || '').trim();
        const avatar = pickAvatar(user.avatar_larger) ||
            pickAvatar(user.avatar_medium) ||
            pickAvatar(user.avatar_thumb) ||
            pickAvatar(user.avatar_300x300) ||
            String(user.avatar_url || user.avatar || '');
        const platformUid = secUid || uniqueId || fallbackId;
        if (!platformUid)
            return null;
        if (!nickname && !avatar) {
            if (!secUid && !uniqueId)
                return null;
        }
        return {
            platform: 'douyin',
            platformUid,
            roomId: uniqueId || fallbackId,
            nickname: nickname || uniqueId || fallbackId,
            avatarUrl: avatar,
            profileUrl: secUid
                ? `https://www.douyin.com/user/${secUid}`
                : `https://www.douyin.com/search/${encodeURIComponent(uniqueId || fallbackId)}?type=user`,
        };
    }
    async fetchStatus(uids) {
        this.requireConfiguredOrSkip('探测抖音开播状态');
        try {
            const { data } = await axios_1.default.post(`${this.base}/douyin/live/batch`, { uids }, {
                timeout: 15000,
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            const rows = data?.data || data || [];
            return uids.map((uid) => {
                const row = Array.isArray(rows)
                    ? rows.find((r) => String(r.uid || r.sec_uid) === uid)
                    : rows[uid];
                const roomStatus = row?.room_status ?? row?.status;
                const isLive = roomStatus === 0 || roomStatus === 'live';
                return {
                    platform: 'douyin',
                    platformUid: uid,
                    status: isLive ? 'live' : 'not_live',
                    title: row?.title || '',
                    coverUrl: row?.cover || '',
                    liveUrl: row?.url || '',
                    provider: this.name,
                    fetchedAt: new Date(),
                    confidence: 0.85,
                };
            });
        }
        catch (e) {
            this.logger.error(`douyin third-party failed: ${e.message}`);
            throw e;
        }
    }
};
exports.DouyinThirdPartyProvider = DouyinThirdPartyProvider;
exports.DouyinThirdPartyProvider = DouyinThirdPartyProvider = DouyinThirdPartyProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DouyinThirdPartyProvider);
function pickAvatar(node) {
    if (!node)
        return '';
    if (typeof node === 'string') {
        const s = node.trim();
        if (/^https?:\/\//i.test(s))
            return s;
        if (s.startsWith('//'))
            return `https:${s}`;
        return '';
    }
    const list = node.url_list || node.urlList;
    if (Array.isArray(list)) {
        for (const item of list) {
            const s = String(item || '').trim();
            if (/^https?:\/\//i.test(s))
                return s;
            if (s.startsWith('//'))
                return `https:${s}`;
        }
    }
    const uri = String(node.uri || node.url || '').trim();
    if (/^https?:\/\//i.test(uri))
        return uri;
    if (uri.startsWith('//'))
        return `https:${uri}`;
    return '';
}
//# sourceMappingURL=douyin-third-party.provider.js.map