import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';
export declare class WechatTokenService {
    private readonly config;
    private readonly redis;
    private readonly logger;
    constructor(config: ConfigService, redis: RedisService);
    getAccessToken(forceRefresh?: boolean): Promise<string>;
}
