import { ProviderRegistry } from './provider.registry';
import { ProviderChainService } from './chain/provider-chain.service';
import { RedisService } from '../../common/redis/redis.service';
import { Platform, NormalizedLiveResult } from './providers/provider.types';
export declare class CrawlerService {
    private readonly registry;
    private readonly chain;
    private readonly redis;
    private readonly logger;
    constructor(registry: ProviderRegistry, chain: ProviderChainService, redis: RedisService);
    resolve(platform: Platform, input: string): Promise<import("./providers/provider.types").NormalizedAnchorProfile>;
    searchUsers(platform: Platform, keyword: string): Promise<{
        platform: Platform;
        platformUid: string;
        nickname: string;
        avatarUrl: string;
        profileUrl: string;
        roomId?: string;
    }[]>;
    fetchStatuses(platform: Platform, uids: string[]): Promise<{
        results: NormalizedLiveResult[];
        allFailed: boolean;
        deferred?: boolean;
    }>;
    healthSummary(): Promise<{
        providers: {
            name: string;
            platform: string;
            ok: boolean;
            detail?: string;
        }[];
    }>;
}
