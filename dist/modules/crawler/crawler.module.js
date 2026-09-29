"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bilibili_provider_1 = require("./providers/bilibili.provider");
const kuaishou_provider_1 = require("./providers/kuaishou.provider");
const douyin_third_party_provider_1 = require("./providers/douyin-third-party.provider");
const douyin_signature_stub_1 = require("./providers/douyin-signature.stub");
const douyin_web_provider_1 = require("./providers/douyin-web.provider");
const douyin_playwright_provider_1 = require("./providers/douyin-playwright.provider");
const douyin_browser_pool_1 = require("./providers/douyin-browser.pool");
const provider_registry_1 = require("./provider.registry");
const provider_chain_service_1 = require("./chain/provider-chain.service");
const crawler_service_1 = require("./crawler.service");
const platform_config_schema_1 = require("./platform-config.schema");
let CrawlerModule = class CrawlerModule {
};
exports.CrawlerModule = CrawlerModule;
exports.CrawlerModule = CrawlerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: platform_config_schema_1.PlatformConfig.name, schema: platform_config_schema_1.PlatformConfigSchema },
            ]),
        ],
        providers: [
            bilibili_provider_1.BilibiliProvider,
            kuaishou_provider_1.KuaishouProvider,
            douyin_third_party_provider_1.DouyinThirdPartyProvider,
            douyin_signature_stub_1.DouyinSignatureStubProvider,
            douyin_web_provider_1.DouyinWebProvider,
            douyin_browser_pool_1.DouyinBrowserPool,
            douyin_playwright_provider_1.DouyinPlaywrightProvider,
            provider_registry_1.ProviderRegistry,
            provider_chain_service_1.ProviderChainService,
            crawler_service_1.CrawlerService,
        ],
        exports: [crawler_service_1.CrawlerService, provider_registry_1.ProviderRegistry, provider_chain_service_1.ProviderChainService],
    })
], CrawlerModule);
//# sourceMappingURL=crawler.module.js.map