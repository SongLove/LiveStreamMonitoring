import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BilibiliProvider } from './providers/bilibili.provider';
import { DouyinThirdPartyProvider } from './providers/douyin-third-party.provider';
import { DouyinSignatureStubProvider } from './providers/douyin-signature.stub';
import { DouyinPlaywrightProvider } from './providers/douyin-playwright.provider';
import { DouyinBrowserPool } from './providers/douyin-browser.pool';
import { ProviderRegistry } from './provider.registry';
import { ProviderChainService } from './chain/provider-chain.service';
import { CrawlerService } from './crawler.service';
import { PlatformConfig, PlatformConfigSchema } from './platform-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
    ]),
  ],
  providers: [
    BilibiliProvider,
    DouyinThirdPartyProvider,
    DouyinSignatureStubProvider,
    DouyinBrowserPool,
    DouyinPlaywrightProvider,
    ProviderRegistry,
    ProviderChainService,
    CrawlerService,
  ],
  exports: [CrawlerService, ProviderRegistry, ProviderChainService],
})
export class CrawlerModule {}
