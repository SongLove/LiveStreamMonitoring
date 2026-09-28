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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LiveService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSessionKey = exports.LiveService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const mongoose_2 = require("mongoose");
const live_session_schema_1 = require("./live-session.schema");
Object.defineProperty(exports, "buildSessionKey", { enumerable: true, get: function () { return live_session_schema_1.buildSessionKey; } });
const anchor_schema_1 = require("../anchor/anchor.schema");
const redis_service_1 = require("../../common/redis/redis.service");
const queues_1 = require("../../common/constants/queues");
let LiveService = LiveService_1 = class LiveService {
    constructor(sessionModel, anchorModel, redis, config, notifyDispatch, pollConfirm) {
        this.sessionModel = sessionModel;
        this.anchorModel = anchorModel;
        this.redis = redis;
        this.config = config;
        this.notifyDispatch = notifyDispatch;
        this.pollConfirm = pollConfirm;
        this.logger = new common_1.Logger(LiveService_1.name);
    }
    snapshotKey(anchorId) {
        return `live:snapshot:${anchorId}`;
    }
    async applyProbeResult(anchorId, status, meta) {
        const anchor = await this.anchorModel.findById(anchorId);
        if (!anchor)
            return { transition: 'none' };
        if (status === 'probe_failed') {
            return this.handleProbeFailed(anchor);
        }
        anchor.consecutiveProbeFailed = 0;
        const isLive = status === 'live';
        await this.redis.set(this.snapshotKey(anchorId), JSON.stringify({ status, at: Date.now(), provider: meta.provider }), 3600);
        const minRebroadcast = this.config.get('live.minRebroadcastMinutes') || 30;
        const confirmOffline = this.config.get('live.confirmOfflinePolls') || 2;
        if (isLive) {
            anchor.consecutiveOffline = 0;
            if (anchor.liveState === 'offline') {
                if (meta.confidence < 0.8) {
                    anchor.liveState = 'pending_confirm';
                    await anchor.save();
                    await this.pollConfirm.add('confirm', { anchorId }, { delay: 15_000, jobId: `confirm:${anchorId}:${Date.now()}` });
                    return { transition: 'pending_confirm' };
                }
                return this.confirmLive(anchor, meta, minRebroadcast);
            }
            if (anchor.liveState === 'pending_confirm') {
                return this.confirmLive(anchor, meta, minRebroadcast);
            }
            await anchor.save();
            return { transition: 'still_live' };
        }
        if (anchor.liveState === 'live' || anchor.liveState === 'pending_confirm') {
            anchor.consecutiveOffline += 1;
            if (anchor.consecutiveOffline >= confirmOffline) {
                await this.markOffline(anchor);
            }
            else {
                await anchor.save();
            }
            return { transition: 'offline_progress' };
        }
        anchor.liveState = 'offline';
        await anchor.save();
        return { transition: 'offline' };
    }
    async handleProbeFailed(anchor) {
        const threshold = this.config.get('live.probeFailForceOffline') || 3;
        const wasShowingLive = anchor.liveState === 'live' || anchor.liveState === 'pending_confirm';
        if (!wasShowingLive) {
            this.logger.warn(`Probe failed for ${anchor.id}, keep offline`);
            return { transition: 'probe_failed' };
        }
        anchor.consecutiveProbeFailed = (anchor.consecutiveProbeFailed || 0) + 1;
        if (anchor.consecutiveProbeFailed < threshold) {
            this.logger.warn(`Probe failed for ${anchor.id} (${anchor.consecutiveProbeFailed}/${threshold}), keep ${anchor.liveState}`);
            await anchor.save();
            return { transition: 'probe_failed' };
        }
        this.logger.warn(`Probe failed ${anchor.consecutiveProbeFailed}x for ${anchor.id}, force offline`);
        await this.markOffline(anchor);
        return { transition: 'force_offline' };
    }
    async markOffline(anchor) {
        anchor.liveState = 'offline';
        anchor.consecutiveProbeFailed = 0;
        await this.sessionModel.updateMany({ anchorId: anchor._id, status: 'live' }, { $set: { status: 'ended', endedAt: new Date() } });
        await anchor.save();
    }
    async confirmLive(anchor, meta, minRebroadcast) {
        const activeSession = await this.sessionModel.findOne({
            anchorId: anchor._id,
            status: 'live',
        });
        if (activeSession && anchor.lastLiveAt) {
            const diff = Date.now() - new Date(anchor.lastLiveAt).getTime();
            if (diff < minRebroadcast * 60_000) {
                anchor.liveState = 'live';
                await anchor.save();
                this.logger.log(`rebroadcast_cooldown anchor=${anchor.id} activeSession=${activeSession.id}`);
                return { transition: 'rebroadcast_cooldown' };
            }
        }
        const startedAt = meta.startedAt || new Date();
        const sessionKey = (0, live_session_schema_1.buildSessionKey)(String(anchor._id), startedAt);
        let session = null;
        try {
            session = await this.sessionModel.create({
                anchorId: anchor._id,
                sessionKey,
                platform: anchor.platform,
                startedAt,
                status: 'live',
                provider: meta.provider,
                title: meta.title || anchor.liveTitle,
                coverUrl: meta.coverUrl || anchor.coverUrl,
            });
        }
        catch (err) {
            if (err?.code === 11000) {
                session = await this.sessionModel.findOne({ sessionKey });
                anchor.liveState = 'live';
                await anchor.save();
                if (session?.id) {
                    await this.enqueueNotifyDispatch(String(session.id), String(anchor._id));
                }
                return { transition: 'session_exists', sessionId: session?.id };
            }
            throw err;
        }
        anchor.liveState = 'live';
        anchor.lastLiveAt = startedAt;
        if (meta.title)
            anchor.liveTitle = meta.title;
        if (meta.coverUrl)
            anchor.coverUrl = meta.coverUrl;
        await anchor.save();
        await this.enqueueNotifyDispatch(String(session.id), String(anchor._id));
        this.logger.log(`live confirmed anchor=${anchor.id} session=${session.id} → notify dispatch`);
        return { transition: 'live', sessionId: session.id };
    }
    async enqueueNotifyDispatch(sessionId, anchorId) {
        await this.notifyDispatch.add('dispatch', { sessionId, anchorId }, { jobId: `dispatch:${sessionId}` });
    }
    async listForUser(userId, page = 1, pageSize = 20) {
        const [items, total] = await Promise.all([
            this.sessionModel
                .find()
                .sort({ startedAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            this.sessionModel.countDocuments(),
        ]);
        return { items, total, page, pageSize, userId };
    }
};
exports.LiveService = LiveService;
exports.LiveService = LiveService = LiveService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(live_session_schema_1.LiveSession.name)),
    __param(1, (0, mongoose_1.InjectModel)(anchor_schema_1.Anchor.name)),
    __param(4, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.NOTIFY_DISPATCH)),
    __param(5, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.POLL_CONFIRM)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService,
        config_1.ConfigService,
        bullmq_2.Queue,
        bullmq_2.Queue])
], LiveService);
//# sourceMappingURL=live.service.js.map