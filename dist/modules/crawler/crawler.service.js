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
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const provider_registry_1 = require("./provider.registry");
const provider_chain_service_1 = require("./chain/provider-chain.service");
const redis_service_1 = require("../../common/redis/redis.service");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    constructor(registry, chain, redis) {
        this.registry = registry;
        this.chain = chain;
        this.redis = redis;
        this.logger = new common_1.Logger(CrawlerService_1.name);
    }
    async resolve(platform, input) {
        if (platform === 'bilibili' || platform === 'kuaishou') {
            return this.registry.primary(platform).resolve(input);
        }
        return this.chain.resolveChain(this.registry.chain(platform), input);
    }
    async searchUsers(platform, keyword) {
        const provider = this.registry.primary(platform);
        if (!provider.searchUsers)
            return [];
        return provider.searchUsers(keyword);
    }
    async fetchStatuses(platform, uids) {
        const bucket = `ratelimit:${platform}`;
        const rate = platform === 'bilibili' ? 10 : platform === 'kuaishou' ? 3 : 5;
        const allowed = await this.redis.takeToken(bucket, rate, rate * 2);
        if (!allowed) {
            this.logger.warn(`Rate limited ${platform}`);
            return { results: [], allFailed: false, deferred: true };
        }
        return this.chain.executeChain(this.registry.chain(platform), uids);
    }
    healthSummary() {
        return this.registry.healthSummary();
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [provider_registry_1.ProviderRegistry,
        provider_chain_service_1.ProviderChainService,
        redis_service_1.RedisService])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map