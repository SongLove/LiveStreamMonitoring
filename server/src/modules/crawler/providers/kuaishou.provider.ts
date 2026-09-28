import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './provider.types';
import { extractKuaishouId, parseKuaishouLiveHtml } from './kuaishou-parse';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * 快手公开直播页（不使用付费 API、不要求登录 Cookie）。
 * 资料来源：https://live.kuaishou.com/u/{principalId} SSR。
 * 开播以页面 isLiving 为准（author.living 经常为 false）。
 */
@Injectable()
export class KuaishouProvider implements LiveProvider {
  readonly name = 'kuaishou-public';
  readonly platform = 'kuaishou' as const;
  private readonly logger = new Logger(KuaishouProvider.name);

  async healthCheck() {
    try {
      const { status } = await axios.get('https://live.kuaishou.com/', {
        timeout: 5000,
        headers: { 'User-Agent': UA },
        validateStatus: () => true,
      });
      return { ok: status < 500, detail: `status ${status}` };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }

  async resolve(input: string): Promise<NormalizedAnchorProfile> {
    const id = extractKuaishouId(input);
    if (!id) {
      throw new BadRequestException('请输入快手号，或直播间链接 live.kuaishou.com/u/快手号');
    }
    const parsed = await this.loadPage(id);
    if (!parsed?.nickname || parsed.nickname === id) {
      if (!parsed?.avatarUrl) {
        throw new BadRequestException(`未找到该快手号：${id}`);
      }
    }
    return {
      platform: 'kuaishou',
      platformUid: parsed.platformUid || id,
      roomId: parsed.platformUid || id,
      nickname: parsed.nickname || id,
      avatarUrl: parsed.avatarUrl,
      profileUrl: `https://live.kuaishou.com/u/${parsed.platformUid || id}`,
    };
  }

  async fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]> {
    const out: NormalizedLiveResult[] = [];
    for (const uid of uids) {
      const id = String(uid || '').trim();
      try {
        const parsed = await this.loadPage(id);
        const living = Boolean(parsed?.living);
        out.push({
          platform: 'kuaishou',
          platformUid: id,
          status: living ? 'live' : 'not_live',
          title: '',
          coverUrl: '',
          liveUrl: `https://live.kuaishou.com/u/${id}`,
          provider: this.name,
          fetchedAt: new Date(),
          confidence: parsed ? 0.8 : 0.2,
        });
      } catch (e) {
        this.logger.warn(`kuaishou probe ${id}: ${(e as Error).message}`);
        out.push({
          platform: 'kuaishou',
          platformUid: id,
          status: 'probe_failed',
          title: '',
          coverUrl: '',
          liveUrl: `https://live.kuaishou.com/u/${id}`,
          provider: this.name,
          fetchedAt: new Date(),
          confidence: 0,
        });
      }
    }
    return out;
  }

  private async loadPage(id: string) {
    const { data } = await axios.get<string>(
      `https://live.kuaishou.com/u/${encodeURIComponent(id)}`,
      {
        timeout: 12000,
        responseType: 'text',
        headers: {
          'User-Agent': UA,
          Referer: 'https://live.kuaishou.com/',
          Accept: 'text/html',
        },
      },
    );
    const html = typeof data === 'string' ? data : String(data || '');
    return parseKuaishouLiveHtml(html, id);
  }
}
