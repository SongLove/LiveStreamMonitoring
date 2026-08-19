import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }

  async connect(): Promise<void> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Acquire a simple distributed lock. Returns unlock token or null. */
  async acquireLock(key: string, ttlMs = 10000): Promise<string | null> {
    const token = randomUUID();
    const result = await this.client.set(key, token, 'PX', ttlMs, 'NX');
    return result === 'OK' ? token : null;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.client.eval(script, 1, key, token);
  }

  /** Token bucket: returns true if a token was consumed. */
  async takeToken(bucketKey: string, ratePerSec: number, capacity: number): Promise<boolean> {
    const now = Date.now();
    const script = `
      local key = KEYS[1]
      local rate = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local data = redis.call("HMGET", key, "tokens", "ts")
      local tokens = tonumber(data[1])
      local ts = tonumber(data[2])
      if tokens == nil then
        tokens = capacity
        ts = now
      end
      local delta = math.max(0, now - ts) / 1000.0
      tokens = math.min(capacity, tokens + delta * rate)
      local allowed = 0
      if tokens >= 1 then
        tokens = tokens - 1
        allowed = 1
      end
      redis.call("HMSET", key, "tokens", tokens, "ts", now)
      redis.call("PEXPIRE", key, 60000)
      return allowed
    `;
    const allowed = await this.client.eval(script, 1, bucketKey, ratePerSec, capacity, now);
    return Number(allowed) === 1;
  }
}
