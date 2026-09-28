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
var BilibiliProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliProvider = void 0;
exports.normalizeBilibiliLiveStatus = normalizeBilibiliLiveStatus;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
function normalizeBilibiliLiveStatus(liveStatus) {
    if (liveStatus === 1)
        return 'live';
    if (liveStatus === 2)
        return 'carousel';
    return 'not_live';
}
let BilibiliProvider = BilibiliProvider_1 = class BilibiliProvider {
    constructor() {
        this.name = 'bilibili-official';
        this.platform = 'bilibili';
        this.logger = new common_1.Logger(BilibiliProvider_1.name);
    }
    async healthCheck() {
        try {
            await axios_1.default.get('https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomList?page=1&page_size=1', {
                timeout: 5000,
            });
            return { ok: true };
        }
        catch (e) {
            return { ok: false, detail: e.message };
        }
    }
    async resolve(input) {
        const uid = input.replace(/\D/g, '') || input.trim();
        try {
            const { data } = await axios_1.default.get(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`, { timeout: 8000, headers: { 'User-Agent': 'LiveStreamMonitoring/1.0' } });
            const info = data?.data;
            if (info?.mid) {
                return {
                    platform: 'bilibili',
                    platformUid: String(info.mid),
                    nickname: info.name || uid,
                    avatarUrl: info.face || '',
                    profileUrl: `https://space.bilibili.com/${info.mid}`,
                    roomId: String(info.live_room?.roomid || ''),
                };
            }
        }
        catch (e) {
            this.logger.warn(`bilibili resolve fallback: ${e.message}`);
        }
        return {
            platform: 'bilibili',
            platformUid: uid,
            nickname: `B站用户${uid}`,
            avatarUrl: '',
            profileUrl: `https://space.bilibili.com/${uid}`,
            roomId: uid,
        };
    }
    async fetchStatus(uids) {
        if (!uids.length)
            return [];
        try {
            const { data } = await axios_1.default.get('https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids', {
                params: { uids: uids.join(',') },
                timeout: 10000,
                headers: { 'User-Agent': 'LiveStreamMonitoring/1.0' },
            });
            const map = data?.data || {};
            return uids.map((uid) => {
                const row = map[uid] || map[Number(uid)];
                const liveStatus = Number(row?.live_status ?? 0);
                const status = normalizeBilibiliLiveStatus(liveStatus);
                return {
                    platform: 'bilibili',
                    platformUid: uid,
                    status: status === 'carousel' ? 'not_live' : status,
                    title: row?.title || '',
                    coverUrl: row?.cover_from_user || row?.keyframe || '',
                    liveUrl: row?.room_id ? `https://live.bilibili.com/${row.room_id}` : '',
                    online: row?.online,
                    provider: this.name,
                    fetchedAt: new Date(),
                    confidence: 0.95,
                };
            });
        }
        catch (e) {
            this.logger.error(`bilibili fetchStatus failed: ${e.message}`);
            return uids.map((uid) => ({
                platform: 'bilibili',
                platformUid: uid,
                status: 'probe_failed',
                title: '',
                coverUrl: '',
                liveUrl: '',
                provider: this.name,
                fetchedAt: new Date(),
                confidence: 0,
            }));
        }
    }
};
exports.BilibiliProvider = BilibiliProvider;
exports.BilibiliProvider = BilibiliProvider = BilibiliProvider_1 = __decorate([
    (0, common_1.Injectable)()
], BilibiliProvider);
//# sourceMappingURL=bilibili.provider.js.map