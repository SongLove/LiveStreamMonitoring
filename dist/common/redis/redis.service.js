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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = require("crypto");
let RedisService = class RedisService {
    constructor(config) {
        this.config = config;
        this.client = new ioredis_1.default({
            host: this.config.get('redis.host'),
            port: this.config.get('redis.port'),
            maxRetriesPerRequest: null,
            lazyConnect: true,
        });
    }
    async connect() {
        if (this.client.status === 'wait') {
            await this.client.connect();
        }
    }
    async onModuleDestroy() {
        await this.client.quit().catch(() => undefined);
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds && ttlSeconds > 0) {
            await this.client.set(key, value, 'EX', ttlSeconds);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        await this.client.del(key);
    }
    async acquireLock(key, ttlMs = 10000) {
        const token = (0, crypto_1.randomUUID)();
        const result = await this.client.set(key, token, 'PX', ttlMs, 'NX');
        return result === 'OK' ? token : null;
    }
    async releaseLock(key, token) {
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        await this.client.eval(script, 1, key, token);
    }
    async takeToken(bucketKey, ratePerSec, capacity) {
        const now = Date.now();
        const script = `
      local key = KEYS[1]
      local rate = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local data = redis.call("HMGET", key, "tokens", "ts")
      local tokens = tonumber(data[1])
      local ts = tonumber(data[2])
      if tokens == nil then
        tokens = capacity
        ts = now
      end
      local delta = math.max(0, now - ts) / 1000.0
      tokens = math.min(capacity, tokens + delta * rate)
      local allowed = 0
      if tokens >= 1 then
        tokens = tokens - 1
        allowed = 1
      end
      redis.call("HMSET", key, "tokens", tokens, "ts", now)
      redis.call("PEXPIRE", key, 60000)
      return allowed
    `;
        const allowed = await this.client.eval(script, 1, bucketKey, ratePerSec, capacity, now);
        return Number(allowed) === 1;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map