import { Injectable, Logger } from '@nestjs/common';
import { ProviderRegistry } from './provider.registry';
import { ProviderChainService } from './chain/provider-chain.service';
import { RedisService } from '../../common/redis/redis.service';
import { Platform, NormalizedLiveResult } from './providers/provider.types';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly registry: ProviderRegistry,
    private readonly chain: ProviderChainService,
    private readonly redis: RedisService,
  ) {}

  async resolve(platform: Platform, input: string) {
    const provider = this.registry.primary(platform);
    return provider.resolve(input);
  }

  async fetchStatuses(
    platform: Platform,
    uids: string[],
  ): Promise<{ results: NormalizedLiveResult[]; allFailed: boolean; deferred?: boolean }> {
    const bucket = `ratelimit:${platform}`;
    const rate = platform === 'bilibili' ? 10 : 5;
    const allowed = await this.redis.takeToken(bucket, rate, rate * 2);
    if (!allowed) {
      this.logger.warn(`Rate limited ${platform}`);
      return { results: [], allFailed: false, deferred: true };
    }
    return this.chain.executeChain(this.registry.chain(platform), uids);
  }

  healthSummary() {
    return this.registry.healthSummary();
  }
}
