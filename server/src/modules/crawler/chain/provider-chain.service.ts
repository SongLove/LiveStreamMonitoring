import { Injectable, Logger } from '@nestjs/common';
import { LiveProvider, NormalizedLiveResult, Platform } from '../providers/provider.types';

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
