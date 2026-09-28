"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProviderChainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderChainService = void 0;
const common_1 = require("@nestjs/common");
const provider_skip_error_1 = require("../providers/provider-skip.error");
let ProviderChainService = ProviderChainService_1 = class ProviderChainService {
    constructor() {
        this.logger = new common_1.Logger(ProviderChainService_1.name);
        this.circuits = new Map();
    }
    isOpen(name) {
        const s = this.circuits.get(name);
        if (!s)
            return false;
        return Date.now() < s.openUntil;
    }
    recordSuccess(name) {
        this.circuits.set(name, { failures: 0, openUntil: 0 });
    }
    recordFailure(name, threshold = 3, openMs = 60_000) {
        const prev = this.circuits.get(name) || { failures: 0, openUntil: 0 };
        const failures = prev.failures + 1;
        const openUntil = failures >= threshold ? Date.now() + openMs : 0;
        this.circuits.set(name, { failures, openUntil });
        if (openUntil)
            this.logger.warn(`Circuit open for ${name}`);
    }
    async resolveChain(providers, input) {
        let lastError;
        let softProfile;
        for (const p of providers) {
            if (this.isOpen(p.name)) {
                this.logger.debug(`resolve skip open circuit: ${p.name}`);
                continue;
            }
            try {
                const profile = await p.resolve(input);
                this.recordSuccess(p.name);
                if ((profile.avatarUrl || '').trim())
                    return profile;
                softProfile = softProfile || profile;
                this.logger.debug(`${p.name} resolve ok but empty avatar, try next provider`);
            }
            catch (e) {
                if ((0, provider_skip_error_1.isProviderSkippedError)(e)) {
                    this.logger.debug(e.message);
                    continue;
                }
                lastError = e;
                this.recordFailure(p.name);
                this.logger.warn(`${p.name} resolve failed: ${lastError.message}`);
            }
        }
        if (softProfile)
            return softProfile;
        if (lastError instanceof common_1.BadRequestException)
            throw lastError;
        throw new common_1.BadRequestException(lastError?.message || '拉取抖音资料失败，请稍后重试');
    }
    async executeChain(providers, uids) {
        for (const p of providers) {
            if (this.isOpen(p.name))
                continue;
            try {
                const results = await p.fetchStatus(uids);
                const failed = results.every((r) => r.status === 'probe_failed');
                if (failed) {
                    this.recordFailure(p.name);
                    continue;
                }
                this.recordSuccess(p.name);
                return { results, allFailed: false };
            }
            catch (e) {
                if ((0, provider_skip_error_1.isProviderSkippedError)(e)) {
                    this.logger.debug(e.message);
                    continue;
                }
                this.recordFailure(p.name);
                this.logger.warn(`${p.name} failed: ${e.message}`);
            }
        }
        return {
            results: uids.map((uid) => ({
                platform: (providers[0]?.platform || 'douyin'),
                platformUid: uid,
                status: 'probe_failed',
                title: '',
                coverUrl: '',
                liveUrl: '',
                provider: 'chain',
                fetchedAt: new Date(),
                confidence: 0,
            })),
            allFailed: true,
        };
    }
};
exports.ProviderChainService = ProviderChainService;
exports.ProviderChainService = ProviderChainService = ProviderChainService_1 = __decorate([
    (0, common_1.Injectable)()
], ProviderChainService);
//# sourceMappingURL=provider-chain.service.js.map