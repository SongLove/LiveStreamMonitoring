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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
const bilibili_provider_1 = require("./providers/bilibili.provider");
const kuaishou_provider_1 = require("./providers/kuaishou.provider");
const douyin_third_party_provider_1 = require("./providers/douyin-third-party.provider");
const douyin_signature_stub_1 = require("./providers/douyin-signature.stub");
const douyin_web_provider_1 = require("./providers/douyin-web.provider");
const douyin_playwright_provider_1 = require("./providers/douyin-playwright.provider");
let ProviderRegistry = class ProviderRegistry {
    constructor(bilibili, kuaishou, douyinThird, douyinSign, douyinWeb, douyinPw) {
        this.bilibili = bilibili;
        this.kuaishou = kuaishou;
        this.douyinThird = douyinThird;
        this.douyinSign = douyinSign;
        this.douyinWeb = douyinWeb;
        this.douyinPw = douyinPw;
    }
    primary(platform) {
        if (platform === 'bilibili')
            return this.bilibili;
        if (platform === 'kuaishou')
            return this.kuaishou;
        return this.douyinThird;
    }
    chain(platform) {
        if (platform === 'bilibili')
            return [this.bilibili];
        if (platform === 'kuaishou')
            return [this.kuaishou];
        return [this.douyinThird, this.douyinSign, this.douyinWeb, this.douyinPw];
    }
    async healthSummary() {
        const providers = [
            this.bilibili,
            this.kuaishou,
            this.douyinThird,
            this.douyinSign,
            this.douyinWeb,
            this.douyinPw,
        ];
        const items = [];
        for (const p of providers) {
            const h = await p.healthCheck();
            items.push({ name: p.name, platform: p.platform, ...h });
        }
        return { providers: items };
    }
};
exports.ProviderRegistry = ProviderRegistry;
exports.ProviderRegistry = ProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bilibili_provider_1.BilibiliProvider,
        kuaishou_provider_1.KuaishouProvider,
        douyin_third_party_provider_1.DouyinThirdPartyProvider,
        douyin_signature_stub_1.DouyinSignatureStubProvider,
        douyin_web_provider_1.DouyinWebProvider,
        douyin_playwright_provider_1.DouyinPlaywrightProvider])
], ProviderRegistry);
//# sourceMappingURL=provider.registry.js.map