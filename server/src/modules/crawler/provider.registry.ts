import { Injectable } from '@nestjs/common';
import { LiveProvider, Platform } from './providers/provider.types';
import { BilibiliProvider } from './providers/bilibili.provider';
import { KuaishouProvider } from './providers/kuaishou.provider';
import { DouyinThirdPartyProvider } from './providers/douyin-third-party.provider';
import { DouyinSignatureStubProvider } from './providers/douyin-signature.stub';
import { DouyinPlaywrightProvider } from './providers/douyin-playwright.provider';

@Injectable()
export class ProviderRegistry {
  constructor(
    private readonly bilibili: BilibiliProvider,
    private readonly kuaishou: KuaishouProvider,
    private readonly douyinThird: DouyinThirdPartyProvider,
    private readonly douyinSign: DouyinSignatureStubProvider,
    private readonly douyinPw: DouyinPlaywrightProvider,
  ) {}

  primary(platform: Platform): LiveProvider {
    if (platform === 'bilibili') return this.bilibili;
    if (platform === 'kuaishou') return this.kuaishou;
    return this.douyinThird;
  }

  /** Douyin: third-party → signature stub → playwright */
  chain(platform: Platform): LiveProvider[] {
    if (platform === 'bilibili') return [this.bilibili];
    if (platform === 'kuaishou') return [this.kuaishou];
    return [this.douyinThird, this.douyinSign, this.douyinPw];
  }

  async healthSummary() {
    const providers = [
      this.bilibili,
      this.kuaishou,
      this.douyinThird,
      this.douyinSign,
      this.douyinPw,
    ];
    const items: Array<{
      name: string;
      platform: string;
      ok: boolean;
      detail?: string;
    }> = [];
    for (const p of providers) {
      const h = await p.healthCheck();
      items.push({ name: p.name, platform: p.platform, ...h });
    }
    return { providers: items };
  }
}
