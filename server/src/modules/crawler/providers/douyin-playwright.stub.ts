import { Injectable, Logger } from '@nestjs/common';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './provider.types';

/** V1.1 skeleton — Playwright persistent context fallback. */
@Injectable()
export class DouyinPlaywrightStubProvider implements LiveProvider {
  readonly name = 'douyin-playwright-stub';
  readonly platform = 'douyin' as const;
  private readonly logger = new Logger(DouyinPlaywrightStubProvider.name);

  async healthCheck() {
    return { ok: false, detail: 'playwright stub not implemented (V1.1)' };
  }

  async resolve(input: string): Promise<NormalizedAnchorProfile> {
    throw new Error('Playwright provider not implemented');
  }

  async fetchStatus(_uids: string[]): Promise<NormalizedLiveResult[]> {
    this.logger.warn('playwright stub invoked');
    throw new Error('Playwright provider not implemented');
  }
}
