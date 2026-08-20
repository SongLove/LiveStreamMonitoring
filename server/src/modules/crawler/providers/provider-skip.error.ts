/** Thrown when a provider cannot serve this request and the chain should try the next one. */
export class ProviderSkippedError extends Error {
  constructor(public readonly providerName: string, reason: string) {
    super(`[${providerName}] skipped: ${reason}`);
    this.name = 'ProviderSkippedError';
  }
}

export function isProviderSkippedError(e: unknown): e is ProviderSkippedError {
  return e instanceof ProviderSkippedError;
}
