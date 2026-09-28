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
var WechatTokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const redis_service_1 = require("../../common/redis/redis.service");
const TOKEN_KEY = 'wechat:access_token';
const TOKEN_LOCK = 'wechat:access_token:lock';
let WechatTokenService = WechatTokenService_1 = class WechatTokenService {
    constructor(config, redis) {
        this.config = config;
        this.redis = redis;
        this.logger = new common_1.Logger(WechatTokenService_1.name);
    }
    async getAccessToken(forceRefresh = false) {
        if (!forceRefresh) {
            const cached = await this.redis.get(TOKEN_KEY);
            if (cached)
                return cached;
        }
        const token = await this.redis.acquireLock(TOKEN_LOCK, 15000);
        if (!token) {
            await new Promise((r) => setTimeout(r, 200));
            const cached = await this.redis.get(TOKEN_KEY);
            if (cached)
                return cached;
            throw new Error('Failed to acquire access_token lock');
        }
        try {
            const again = await this.redis.get(TOKEN_KEY);
            if (!forceRefresh && again)
                return again;
            const appId = this.config.get('wechat.appId') || '';
            const secret = this.config.get('wechat.secret') || '';
            if (!appId || !secret) {
                const mock = 'mock_access_token';
                await this.redis.set(TOKEN_KEY, mock, 7000);
                return mock;
            }
            const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`;
            const { data } = await axios_1.default.get(url, { timeout: 10000 });
            if (!data.access_token) {
                this.logger.error(`access_token error: ${data.errcode}`);
                throw new Error(`WeChat token error ${data.errcode}`);
            }
            const ttl = Math.max(60, (data.expires_in || 7200) - 200);
            await this.redis.set(TOKEN_KEY, data.access_token, ttl);
            return data.access_token;
        }
        finally {
            await this.redis.releaseLock(TOKEN_LOCK, token);
        }
    }
};
exports.WechatTokenService = WechatTokenService;
exports.WechatTokenService = WechatTokenService = WechatTokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService])
], WechatTokenService);
//# sourceMappingURL=wechat-token.service.js.map