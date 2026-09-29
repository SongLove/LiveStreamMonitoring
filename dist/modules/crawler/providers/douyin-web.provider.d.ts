import { LiveProvider, NormalizedAnchorProfile, NormalizedLiveResult } from './provider.types';
export declare class DouyinWebProvider implements LiveProvider {
    readonly name = "douyin-web";
    readonly platform: "douyin";
    private readonly logger;
    healthCheck(): Promise<{
        ok: boolean;
        detail: string;
    }>;
    resolve(_input: string): Promise<NormalizedAnchorProfile>;
    fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]>;
    private probeOne;
}
