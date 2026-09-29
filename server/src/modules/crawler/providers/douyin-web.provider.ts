import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './provider.types';
import { ProviderSkippedError } from './provider-skip.error';
import { isDouyinUniqueId } from './douyin-input';
import { parseDouyinLivePayload } from './douyin-live-parse';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * 抖音开播探测：先拿直播页 ttwid，再调 webcast/room/web/enter。
 * 不走浏览器。资料解析仍由后续 Playwright 负责。
 */
@Injectable()
export class DouyinWebProvider implements LiveProvider {
  readonly name = 'douyin-web';
  readonly platform = 'douyin' as const;
  private readonly logger = new Logger(DouyinWebProvider.name);

  async healthCheck() {
    return { ok: true, detail: 'webcast room enter' };
  }

  async resolve(_input: string): Promise<NormalizedAnchorProfile> {
    throw new ProviderSkippedError(this.name, 'profile resolve uses playwright');
  }

  async fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]> {
    const out: NormalizedLiveResult[] = [];
    for (const uid of uids) {
      out.push(await this.probeOne(String(uid || '').trim()));
    }
    return out;
  }

  private async probeOne(id: string): Promise<NormalizedLiveResult> {
    const liveUrl = id ? `https://live.douyin.com/${encodeURIComponent(id)}` : '';
    const failed = (): NormalizedLiveResult => ({
      platform: 'douyin',
      platformUid: id,
      status: 'probe_failed',
      title: '',
      coverUrl: '',
      liveUrl,
      provider: this.name,
      fetchedAt: new Date(),
      confidence: 0,
    });
    if (!isDouyinUniqueId(id)) return failed();

    try {
      const home = await axios.get<string>(liveUrl, {
        timeout: 12000,
        responseType: 'text',
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        validateStatus: () => true,
      });
      const setCookie = home.headers['set-cookie'];
      const cookie = (Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [])
        .map((c) => c.split(';')[0])
        .join('; ');
      const enter = await axios.get('https://live.douyin.com/webcast/room/web/enter/', {
        params: {
          aid: 6383,
          app_name: 'douyin_web',
          live_id: 1,
          device_platform: 'web',
          language: 'zh-CN',
          enter_from: 'web_live',
          cookie_enabled: true,
          browser_language: 'zh-CN',
          browser_platform: 'MacIntel',
          browser_name: 'Chrome',
          browser_version: '122.0.0.0',
          web_rid: id,
        },
        timeout: 12000,
        headers: {
          'User-Agent': UA,
          Referer: liveUrl,
          Cookie: cookie,
        },
        validateStatus: () => true,
      });
      const parsed = parseDouyinLivePayload(enter.data, id);
      if (!parsed) {
        this.logger.warn(`douyin web probe no room_status for ${id}`);
        return failed();
      }
      return {
        platform: 'douyin',
        platformUid: id,
        status: parsed.status,
        title: parsed.title,
        coverUrl: parsed.coverUrl,
        liveUrl,
        provider: this.name,
        fetchedAt: new Date(),
        confidence: parsed.confidence,
      };
    } catch (e) {
      this.logger.warn(`douyin web probe ${id}: ${(e as Error).message}`);
      return failed();
    }
  }
}
