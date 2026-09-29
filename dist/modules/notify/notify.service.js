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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotifyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const notify_log_schema_1 = require("./notify-log.schema");
const user_service_1 = require("../user/user.service");
const quota_service_1 = require("../quota/quota.service");
const wechat_service_1 = require("../wechat/wechat.service");
const live_notify_data_1 = require("./live-notify-data");
const subscription_service_1 = require("../subscription/subscription.service");
const anchor_service_1 = require("../anchor/anchor.service");
const live_session_schema_1 = require("../live/live-session.schema");
let NotifyService = NotifyService_1 = class NotifyService {
    constructor(notifyLogModel, sessionModel, userService, quotaService, wechatService, subscriptionService, anchorService, config) {
        this.notifyLogModel = notifyLogModel;
        this.sessionModel = sessionModel;
        this.userService = userService;
        this.quotaService = quotaService;
        this.wechatService = wechatService;
        this.subscriptionService = subscriptionService;
        this.anchorService = anchorService;
        this.config = config;
        this.logger = new common_1.Logger(NotifyService_1.name);
        this.holidayCache = null;
    }
    async validateChain(params) {
        const sub = await this.subscriptionService.findActive(params.userId, params.anchorId);
        if (!sub || !sub.enabled)
            return { pass: false, reason: 'subscription_disabled' };
        const user = await this.userService.findById(params.userId);
        if (user.status === 'banned' || user.status === 'deleting') {
            return { pass: false, reason: 'user_banned' };
        }
        if (!user.settings.notifyEnabled)
            return { pass: false, reason: 'notify_disabled' };
        if (user.settings.dndEnabled && this.inDnd(user.settings.dndStart, user.settings.dndEnd)) {
            return { pass: false, reason: 'dnd' };
        }
        if (user.settings.studentMode && !(await this.isStudentAllowedNow())) {
            return { pass: false, reason: 'student_mode' };
        }
        if (user.settings.largeAccountOnly && !params.isLargeAccount) {
            return { pass: false, reason: 'large_account_only' };
        }
        if (user.settings.cooldownMinutes > 0) {
            const since = new Date(Date.now() - user.settings.cooldownMinutes * 60_000);
            const recent = await this.notifyLogModel.findOne({
                userId: new mongoose_2.Types.ObjectId(params.userId),
                state: { $in: ['sent', 'success'] },
                createdAt: { $gte: since },
            });
            if (recent)
                return { pass: false, reason: 'cooldown' };
        }
        const dup = await this.notifyLogModel.findOne({
            userId: new mongoose_2.Types.ObjectId(params.userId),
            sessionId: new mongoose_2.Types.ObjectId(params.sessionId),
            templateId: params.templateId,
            state: { $in: ['sent', 'success', 'pending'] },
        });
        if (dup)
            return { pass: false, reason: 'duplicate' };
        const auth = user.templateAuth?.[params.templateId];
        if (auth === 'reject')
            return { pass: false, reason: 'template_unauthorized' };
        const snap = await this.quotaService.getSnapshot(params.userId);
        if (snap.balance <= 0)
            return { pass: false, reason: 'quota_insufficient' };
        return { pass: true, reason: 'ok' };
    }
    inDnd(start, end, now = new Date()) {
        const toMin = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + (m || 0);
        };
        const cur = now.getHours() * 60 + now.getMinutes();
        const s = toMin(start);
        const e = toMin(end);
        if (s === e)
            return false;
        if (s < e)
            return cur >= s && cur < e;
        return cur >= s || cur < e;
    }
    async isStudentAllowedNow() {
        const now = new Date();
        const day = now.getDay();
        if (day === 0 || day === 6)
            return true;
        const days = await this.getHolidayDays(now.getFullYear());
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return days.has(key);
    }
    async getHolidayDays(year) {
        if (this.holidayCache && this.holidayCache.year === year && Date.now() - this.holidayCache.loadedAt < 86400_000) {
            return this.holidayCache.days;
        }
        const set = new Set();
        try {
            const base = this.config.get('holidayApiUrl');
            const { data } = await axios_1.default.get(`${base}/${year}`, { timeout: 8000 });
            const holiday = data?.holiday || {};
            for (const [k, v] of Object.entries(holiday)) {
                if (v?.holiday)
                    set.add(k.length === 5 ? `${year}-${k}` : k);
            }
        }
        catch (e) {
            this.logger.warn(`Holiday API failed: ${e.message}`);
        }
        this.holidayCache = { year, days: set, loadedAt: Date.now() };
        return set;
    }
    async sendForUser(params) {
        const templateId = this.config.get('wechat.subscribeTemplateId') || 'TMPL_LIVE_NOTIFY';
        const anchor = await this.anchorService.findById(params.anchorId);
        const check = await this.validateChain({
            ...params,
            templateId,
            isLargeAccount: (anchor.followerCount || 0) >= 100000,
        });
        if (!check.pass) {
            try {
                await this.notifyLogModel.create({
                    userId: new mongoose_2.Types.ObjectId(params.userId),
                    sessionId: new mongoose_2.Types.ObjectId(params.sessionId),
                    anchorId: new mongoose_2.Types.ObjectId(params.anchorId),
                    templateId,
                    state: 'skipped',
                    skipReason: check.reason,
                });
            }
            catch (err) {
                if (err?.code !== 11000)
                    throw err;
            }
            return { skipped: check.reason };
        }
        const deductKey = `deduct:${params.userId}:${params.sessionId}:${templateId}`;
        const deducted = await this.quotaService.deduct(params.userId, deductKey);
        if (!deducted) {
            await this.notifyLogModel.create({
                userId: new mongoose_2.Types.ObjectId(params.userId),
                sessionId: new mongoose_2.Types.ObjectId(params.sessionId),
                anchorId: new mongoose_2.Types.ObjectId(params.anchorId),
                templateId,
                state: 'skipped',
                skipReason: 'quota_insufficient',
            });
            return { skipped: 'quota_insufficient' };
        }
        const user = await this.userService.findById(params.userId);
        const title = this.wechatService.truncateField(anchor.nickname || '主播', 20);
        const room = this.wechatService.truncateField(anchor.liveTitle || '正在直播', 20);
        const page = `pages/live/detail?sessionId=${params.sessionId}`;
        let log;
        try {
            log = await this.notifyLogModel.create({
                userId: new mongoose_2.Types.ObjectId(params.userId),
                sessionId: new mongoose_2.Types.ObjectId(params.sessionId),
                anchorId: new mongoose_2.Types.ObjectId(params.anchorId),
                templateId,
                state: 'pending',
                payload: { page, title, room },
            });
        }
        catch (err) {
            if (err?.code === 11000) {
                await this.quotaService.refund(params.userId, `refund:dup:${deductKey}`, 'duplicate_notify');
                return { skipped: 'duplicate' };
            }
            throw err;
        }
        const result = await this.wechatService.sendSubscribeMessage({
            openid: user.openid,
            templateId,
            page,
            data: (0, live_notify_data_1.buildLiveNotifyData)({
                anchorName: title,
                topic: room,
                remark: '开播提醒',
                time: (0, live_notify_data_1.formatSubscribeTime)(),
            }),
        });
        if (result.errcode === 0) {
            log.state = 'sent';
            log.wxMsgId = String(result.msgid || '');
            await log.save();
            return { sent: true };
        }
        if (this.wechatService.shouldRefundError(result.errcode)) {
            await this.quotaService.refund(params.userId, `refund:wx:${params.userId}:${params.sessionId}:${result.errcode}`, `wx_${result.errcode}`);
            if (result.errcode === 43101) {
                await this.userService.setTemplateAuth(params.userId, templateId, 'reject');
            }
        }
        log.state = 'failed';
        log.skipReason = `wx_${result.errcode}`;
        await log.save();
        return { sent: false };
    }
    async listForUser(userId, page = 1, pageSize = 20) {
        const filter = { userId: new mongoose_2.Types.ObjectId(userId) };
        const [items, total] = await Promise.all([
            this.notifyLogModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            this.notifyLogModel.countDocuments(filter),
        ]);
        return { items, total, page, pageSize };
    }
    async testNotify(userId) {
        return {
            message: 'Use admin/manual tool or create live session first',
            hint: 'POST with real session after live confirm',
        };
    }
};
exports.NotifyService = NotifyService;
exports.NotifyService = NotifyService = NotifyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notify_log_schema_1.NotifyLog.name)),
    __param(1, (0, mongoose_1.InjectModel)(live_session_schema_1.LiveSession.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        user_service_1.UserService,
        quota_service_1.QuotaService,
        wechat_service_1.WechatService,
        subscription_service_1.SubscriptionService,
        anchor_service_1.AnchorService,
        config_1.ConfigService])
], NotifyService);
//# sourceMappingURL=notify.service.js.map