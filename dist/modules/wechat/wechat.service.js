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
var WechatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const wechat_token_service_1 = require("./wechat-token.service");
const normalize_1 = require("../../common/utils/normalize");
const wechat_callback_parse_1 = require("./wechat-callback.parse");
const quota_service_1 = require("../quota/quota.service");
const user_service_1 = require("../user/user.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const notify_log_schema_1 = require("../notify/notify-log.schema");
let WechatService = WechatService_1 = class WechatService {
    constructor(config, tokenService, quotaService, userService, notifyLogModel) {
        this.config = config;
        this.tokenService = tokenService;
        this.quotaService = quotaService;
        this.userService = userService;
        this.notifyLogModel = notifyLogModel;
        this.logger = new common_1.Logger(WechatService_1.name);
    }
    isMockMode() {
        return !(this.config.get('wechat.appId') || '');
    }
    async code2Session(code) {
        if (this.isMockMode()) {
            return { openid: `mock_openid_${code || 'dev'}` };
        }
        const appId = this.config.get('wechat.appId');
        const secret = this.config.get('wechat.secret');
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
        const { data } = await axios_1.default.get(url, { timeout: 10000 });
        if (!data.openid) {
            throw new common_1.UnauthorizedException(`Invalid wechat code: ${data.errcode}`);
        }
        return { openid: data.openid, session_key: data.session_key };
    }
    verifyCallbackSignature(query) {
        const token = this.config.get('wechat.token') || '';
        if (this.isMockMode() || !token)
            return true;
        const { signature, timestamp, nonce } = query;
        if (!signature || !timestamp || !nonce)
            return false;
        const arr = [token, timestamp, nonce].sort();
        const hash = (0, crypto_1.createHash)('sha1').update(arr.join('')).digest('hex');
        return hash === signature;
    }
    async handleSubscribeCallback(body) {
        const parsed = (0, wechat_callback_parse_1.parseWechatCallbackBody)(body);
        if (parsed.encrypted) {
            this.logger.warn('WeChat callback is encrypted; set 明文模式 or implement AES decrypt (WECHAT_ENCODING_AES_KEY)');
            return { processed: 0 };
        }
        const openid = parsed.fromUserName;
        const createTime = parsed.createTime || String(Date.now());
        let processed = 0;
        for (const item of parsed.items) {
            const templateId = item.templateId;
            const status = item.status.toLowerCase();
            if (!openid || !templateId)
                continue;
            if (status === 'reject' || status === 'reject_with_no_dialog') {
                await this.userService.setTemplateAuthByOpenId(openid, templateId, 'reject');
                processed += 1;
                continue;
            }
            if (status === 'accept' || status === 'acceptwithforcepush') {
                await this.userService.setTemplateAuthByOpenId(openid, templateId, 'accept');
                const user = await this.userService.findByOpenId(openid);
                if (user) {
                    const idempotencyKey = `grant:${openid}:${templateId}:${createTime}:${item.popupScene || '0'}`;
                    const result = await this.quotaService.grantFromWechatCallback({
                        userId: user.id,
                        templateId,
                        idempotencyKey,
                        meta: { source: 'wechat_callback', event: parsed.event },
                    });
                    this.logger.log(`subscribe accept openid=${openid.slice(0, 8)}… granted=${result.granted} balance=${result.balance}`);
                }
                else {
                    this.logger.warn(`subscribe accept but user not found for openid=${openid.slice(0, 8)}…`);
                }
                processed += 1;
            }
        }
        if (processed === 0 && (parsed.fromUserName || parsed.items.length > 0)) {
            this.logger.warn(`subscribe callback parsed but not processed event=${parsed.event} items=${parsed.items.length}`);
        }
        return { processed };
    }
    async mockGrantAccept(userId, templateId) {
        await this.userService.setTemplateAuth(userId, templateId, 'accept');
        const idempotencyKey = `grant:mock:${userId}:${templateId}:${Date.now()}`;
        const result = await this.quotaService.grantFromWechatCallback({
            userId,
            templateId,
            idempotencyKey,
            meta: { source: 'mock_subscribe_accept' },
        });
        return result;
    }
    async handleNotifyResultCallback(body) {
        const list = (0, normalize_1.normalizeWechatList)(body?.List || body?.list || body);
        for (const item of list) {
            const msgId = item.MsgID || item.msgId;
            const status = item.Status || item.status;
            if (!msgId)
                continue;
            const log = await this.notifyLogModel.findOne({ wxMsgId: String(msgId) });
            if (!log)
                continue;
            const failed = String(status).toLowerCase().includes('failed');
            log.finalStatus = failed ? 'failed' : 'success';
            log.receipt = item;
            await log.save();
            if (failed && this.shouldRefundError(Number(item.ErrorCode || item.errcode || 0))) {
                await this.quotaService.refund(String(log.userId), `refund:receipt:${log.id}`, 'async_receipt_refund');
            }
        }
    }
    shouldRefundError(errcode) {
        return [43101, 47003, 41030].includes(errcode);
    }
    async sendSubscribeMessage(params) {
        if (this.isMockMode()) {
            return { errcode: 0, errmsg: 'ok', msgid: `mock_${Date.now()}` };
        }
        const accessToken = await this.tokenService.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
        const { data } = await axios_1.default.post(url, {
            touser: params.openid,
            template_id: params.templateId,
            page: params.page,
            miniprogram_state: this.config.get('wechat.miniProgramState'),
            lang: 'zh_CN',
            data: params.data,
        }, { timeout: 10000 });
        if (data.errcode === 40001) {
            await this.tokenService.getAccessToken(true);
        }
        return data;
    }
    truncateField(value, max = 20) {
        const s = String(value || '');
        return s.length > max ? s.slice(0, max - 1) + '…' : s;
    }
};
exports.WechatService = WechatService;
exports.WechatService = WechatService = WechatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, mongoose_1.InjectModel)(notify_log_schema_1.NotifyLog.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        wechat_token_service_1.WechatTokenService,
        quota_service_1.QuotaService,
        user_service_1.UserService,
        mongoose_2.Model])
], WechatService);
//# sourceMappingURL=wechat.service.js.map