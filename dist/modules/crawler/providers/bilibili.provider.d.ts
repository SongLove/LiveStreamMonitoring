import { LiveProvider, NormalizedAnchorProfile, NormalizedLiveResult, NormalizedLiveStatus } from './provider.types';
export declare function normalizeBilibiliLiveStatus(liveStatus: number): NormalizedLiveStatus;
export declare function bilibiliStatusQuery(uids: string[]): string;
export declare function mapBilibiliStatusBody(uids: string[], body: {
    code?: number;
    data?: unknown;
}): Array<{
    platformUid: string;
    status: NormalizedLiveStatus;
    title: string;
    roomId: string;
    coverUrl: string;
    online?: number;
}>;
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
