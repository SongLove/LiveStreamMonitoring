import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { RedisService } from '../../common/redis/redis.service';
export declare class HealthController {
    private readonly health;
    private readonly mongo;
    private readonly redis;
    constructor(health: HealthCheckService, mongo: MongooseHealthIndicator, redis: RedisService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & {
        redis: {
            status: "up";
        };
    } & import("@nestjs/terminus").HealthIndicatorResult<"mongodb">, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & {
        redis: {
            status: "up";
        };
    } & import("@nestjs/terminus").HealthIndicatorResult<"mongodb">> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & {
        redis: {
            status: "up";
        };
    } & import("@nestjs/terminus").HealthIndicatorResult<"mongodb">> | undefined>>;
}
