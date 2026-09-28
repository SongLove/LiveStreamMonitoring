import { LiveProvider, NormalizedAnchorProfile, NormalizedLiveResult } from './provider.types';
export declare class DouyinSignatureStubProvider implements LiveProvider {
    readonly name = "douyin-signature-stub";
    readonly platform: "douyin";
    private readonly logger;
    healthCheck(): Promise<{
        ok: boolean;
        detail: string;
    }>;
    resolve(_input: string): Promise<NormalizedAnchorProfile>;
    fetchStatus(_uids: string[]): Promise<NormalizedLiveResult[]>;
}
