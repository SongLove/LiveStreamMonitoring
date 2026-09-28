import { LiveProvider, NormalizedAnchorProfile, NormalizedLiveResult } from './provider.types';
import { DouyinBrowserPool } from './douyin-browser.pool';
export declare class DouyinPlaywrightProvider implements LiveProvider {
    private readonly pool;
    readonly name = "douyin-playwright";
    readonly platform: "douyin";
    private readonly logger;
    constructor(pool: DouyinBrowserPool);
    healthCheck(): Promise<{
        ok: boolean;
        detail: string;
    }>;
    resolve(input: string): Promise<NormalizedAnchorProfile>;
    private fetchViaBrowser;
    private attachCapture;
    private openPage;
    private pickFromCaptured;
    private findRealUserHref;
    private matchesTarget;
    fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]>;
    private probeOneLive;
}
export declare function parseDouyinLiveFromHtml(html: string, targetWebRid?: string): import("./douyin-live-parse").ParsedDouyinLive | null;
export declare function isIncompleteDouyinProfile(doc: {
    nickname?: string;
    avatarUrl?: string;
    platformUid?: string;
    roomId?: string;
}): boolean;
