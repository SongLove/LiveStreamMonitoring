import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  LiveProvider,
  NormalizedAnchorProfile,
  NormalizedLiveResult,
  Platform,
} from '../providers/provider.types';
import { isProviderSkippedError } from '../providers/provider-skip.error';

interface CircuitState {
  failures: number;
  openUntil: number;
}

@Injectable()
export class ProviderChainService {
  private readonly logger = new Logger(ProviderChainService.name);
  private readonly circuits = new Map<string, CircuitState>();

  isOpen(name: string): boolean {
    const s = this.circuits.get(name);
    if (!s) return false;
    return Date.now() < s.openUntil;
  }

  recordSuccess(name: string) {
    this.circuits.set(name, { failures: 0, openUntil: 0 });
  }

  recordFailure(name: string, threshold = 3, openMs = 60_000) {
    const prev = this.circuits.get(name) || { failures: 0, openUntil: 0 };
    const failures = prev.failures + 1;
    const openUntil = failures >= threshold ? Date.now() + openMs : 0;
    this.circuits.set(name, { failures, openUntil });
    if (openUntil) this.logger.warn(`Circuit open for ${name}`);
  }

  /** Profile resolve: third-party → signature → playwright. Skip does not trip circuit.
   * 无头像的成功响应视为半成品，继续试下一链（避免 TikHub/占位资料短路 Playwright）。 */
  async resolveChain(
    providers: LiveProvider[],
    input: string,
  ): Promise<NormalizedAnchorProfile> {
    let lastError: Error | undefined;
    let softProfile: NormalizedAnchorProfile | undefined;
    for (const p of providers) {
      if (this.isOpen(p.name)) {
        this.logger.debug(`resolve skip open circuit: ${p.name}`);
        continue;
      }
      try {
        const profile = await p.resolve(input);
        this.recordSuccess(p.name);
        if ((profile.avatarUrl || '').trim()) return profile;
        softProfile = softProfile || profile;
        this.logger.debug(
          `${p.name} resolve ok but empty avatar, try next provider`,
        );
      } catch (e) {
        if (isProviderSkippedError(e)) {
          this.logger.debug(e.message);
          continue;
        }
        lastError = e as Error;
        this.recordFailure(p.name);
        this.logger.warn(`${p.name} resolve failed: ${lastError.message}`);
      }
    }
    if (softProfile) return softProfile;
    if (lastError instanceof BadRequestException) throw lastError;
    throw new BadRequestException(
      lastError?.message || '拉取抖音资料失败，请稍后重试',
    );
  }

  async executeChain(
    providers: LiveProvider[],
    uids: string[],
  ): Promise<{ results: NormalizedLiveResult[]; allFailed: boolean }> {
    for (const p of providers) {
      if (this.isOpen(p.name)) continue;
      try {
        const results = await p.fetchStatus(uids);
        const failed = results.every((r) => r.status === 'probe_failed');
        if (failed) {
          this.recordFailure(p.name);
          continue;
        }
        this.recordSuccess(p.name);
        return { results, allFailed: false };
      } catch (e) {
        if (isProviderSkippedError(e)) {
          this.logger.debug((e as Error).message);
          continue;
        }
        this.recordFailure(p.name);
        this.logger.warn(`${p.name} failed: ${(e as Error).message}`);
      }
    }
    return {
      results: uids.map((uid) => ({
        platform: (providers[0]?.platform || 'douyin') as Platform,
        platformUid: uid,
        status: 'probe_failed' as const,
        title: '',
        coverUrl: '',
        liveUrl: '',
        provider: 'chain',
        fetchedAt: new Date(),
        confidence: 0,
      })),
      allFailed: true,
    };
  }
}
