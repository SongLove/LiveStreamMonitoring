import { LiveProvider, NormalizedAnchorProfile, NormalizedLiveResult, NormalizedLiveStatus } from './provider.types';
export declare function normalizeBilibiliLiveStatus(liveStatus: number): NormalizedLiveStatus;
export declare class BilibiliProvider implements LiveProvider {
    readonly name = "bilibili-official";
    readonly platform: "bilibili";
    private readonly logger;
    healthCheck(): Promise<{
        ok: boolean;
        detail?: undefined;
    } | {
        ok: boolean;
        detail: string;
    }>;
    resolve(input: string): Promise<NormalizedAnchorProfile>;
    fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]>;
}
