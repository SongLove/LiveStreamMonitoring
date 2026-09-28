import { LiveProvider, Platform } from './providers/provider.types';
import { BilibiliProvider } from './providers/bilibili.provider';
import { KuaishouProvider } from './providers/kuaishou.provider';
import { DouyinThirdPartyProvider } from './providers/douyin-third-party.provider';
import { DouyinSignatureStubProvider } from './providers/douyin-signature.stub';
import { DouyinPlaywrightProvider } from './providers/douyin-playwright.provider';
export declare class ProviderRegistry {
    private readonly bilibili;
    private readonly kuaishou;
    private readonly douyinThird;
    private readonly douyinSign;
    private readonly douyinPw;
    constructor(bilibili: BilibiliProvider, kuaishou: KuaishouProvider, douyinThird: DouyinThirdPartyProvider, douyinSign: DouyinSignatureStubProvider, douyinPw: DouyinPlaywrightProvider);
    primary(platform: Platform): LiveProvider;
    chain(platform: Platform): LiveProvider[];
    healthSummary(): Promise<{
        providers: {
            name: string;
            platform: string;
            ok: boolean;
            detail?: string;
        }[];
    }>;
}
