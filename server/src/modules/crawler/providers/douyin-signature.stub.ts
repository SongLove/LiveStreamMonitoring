import { Injectable, Logger } from '@nestjs/common';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
} from './provider.types';
import { ProviderSkippedError } from './provider-skip.error';

/** V1.1 skeleton — signature direct adapter (not used as V1 primary). */
@Injectable()
export class DouyinSignatureStubProvider implements LiveProvider {
  readonly name = 'douyin-signature-stub';
  readonly platform = 'douyin' as const;
  private readonly logger = new Logger(DouyinSignatureStubProvider.name);

  async healthCheck() {
    return { ok: false, detail: 'signature stub not implemented (V1.1)' };
  }

  async resolve(_input: string): Promise<NormalizedAnchorProfile> {
    throw new ProviderSkippedError(this.name, 'signature not implemented');
  }

  async fetchStatus(_uids: string[]): Promise<NormalizedLiveResult[]> {
    this.logger.warn('signature stub invoked');
    throw new ProviderSkippedError(this.name, 'signature not implemented');
  }
}
