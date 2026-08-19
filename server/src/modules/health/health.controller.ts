import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { RedisService } from '../../common/redis/redis.service';

@ApiTags('系统')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongo: MongooseHealthIndicator,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: '健康检查', description: 'MongoDB + Redis 探针' })
  @ApiResponse({ status: 200, description: '服务健康' })
  @ApiResponse({ status: 503, description: '依赖不可用' })
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongo.pingCheck('mongodb'),
      async () => {
        try {
          await this.redis.client.ping();
          return { redis: { status: 'up' as const } };
        } catch (e) {
          throw e;
        }
      },
    ]);
  }
}
