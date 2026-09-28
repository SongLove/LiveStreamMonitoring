export declare class ProviderSkippedError extends Error {
    readonly providerName: string;
    constructor(providerName: string, reason: string);
}
export declare function isProviderSkippedError(e: unknown): e is ProviderSkippedError;
