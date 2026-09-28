import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly config;
    readonly client: Redis;
    constructor(config: ConfigService);
    connect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    acquireLock(key: string, ttlMs?: number): Promise<string | null>;
    releaseLock(key: string, token: string): Promise<void>;
    takeToken(bucketKey: string, ratePerSec: number, capacity: number): Promise<boolean>;
}
