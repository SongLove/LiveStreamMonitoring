import { LiveProvider, NormalizedAnchorProfile, NormalizedLiveResult } from './provider.types';
export declare class KuaishouProvider implements LiveProvider {
    readonly name = "kuaishou-public";
    readonly platform: "kuaishou";
    private readonly logger;
    healthCheck(): Promise<{
        ok: boolean;
        detail: string;
    }>;
    resolve(input: string): Promise<NormalizedAnchorProfile>;
    fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]>;
    private loadPage;
}
