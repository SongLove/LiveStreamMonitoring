import { ConfigService } from '@nestjs/config';
import { LiveProvider, NormalizedAnchorProfile, NormalizedLiveResult } from './provider.types';
export declare class DouyinThirdPartyProvider implements LiveProvider {
    private readonly config;
    readonly name = "douyin-third-party";
    readonly platform: "douyin";
    private readonly logger;
    constructor(config: ConfigService);
    private get base();
    private get apiKey();
    private get configured();
    private requireConfiguredOrSkip;
    healthCheck(): Promise<{
        ok: boolean;
        detail: string;
    } | {
        ok: boolean;
        detail?: undefined;
    }>;
    searchUsers(_keyword: string): Promise<NormalizedAnchorProfile[]>;
    resolve(input: string): Promise<NormalizedAnchorProfile>;
    fetchProfile(id: string, idType: 'unique_id' | 'sec_uid'): Promise<NormalizedAnchorProfile>;
    private mapProfilePayload;
    fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]>;
}
