import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from '../../common/redis/redis.service';

const TOKEN_KEY = 'wechat:access_token';
const TOKEN_LOCK = 'wechat:access_token:lock';

@Injectable()
export class WechatTokenService {
  private readonly logger = new Logger(WechatTokenService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh) {
      const cached = await this.redis.get(TOKEN_KEY);
      if (cached) return cached;
    }

    const token = await this.redis.acquireLock(TOKEN_LOCK, 15000);
    if (!token) {
      await new Promise((r) => setTimeout(r, 200));
      const cached = await this.redis.get(TOKEN_KEY);
      if (cached) return cached;
      throw new Error('Failed to acquire access_token lock');
    }

    try {
      const again = await this.redis.get(TOKEN_KEY);
      if (!forceRefresh && again) return again;

      const appId = this.config.get<string>('wechat.appId') || '';
      const secret = this.config.get<string>('wechat.secret') || '';
      if (!appId || !secret) {
        const mock = 'mock_access_token';
        await this.redis.set(TOKEN_KEY, mock, 7000);
        return mock;
      }

      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`;
      const { data } = await axios.get(url, { timeout: 10000 });
      if (!data.access_token) {
        this.logger.error(`access_token error: ${data.errcode}`);
        throw new Error(`WeChat token error ${data.errcode}`);
      }
      const ttl = Math.max(60, (data.expires_in || 7200) - 200);
      await this.redis.set(TOKEN_KEY, data.access_token, ttl);
      return data.access_token;
    } finally {
      await this.redis.releaseLock(TOKEN_LOCK, token);
    }
  }
}
