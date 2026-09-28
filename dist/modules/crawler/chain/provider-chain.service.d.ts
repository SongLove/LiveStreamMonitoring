import { LiveProvider, NormalizedAnchorProfile, NormalizedLiveResult } from '../providers/provider.types';
export declare class ProviderChainService {
    private readonly logger;
    private readonly circuits;
    isOpen(name: string): boolean;
    recordSuccess(name: string): void;
    recordFailure(name: string, threshold?: number, openMs?: number): void;
    resolveChain(providers: LiveProvider[], input: string): Promise<NormalizedAnchorProfile>;
    executeChain(providers: LiveProvider[], uids: string[]): Promise<{
        results: NormalizedLiveResult[];
        allFailed: boolean;
    }>;
}
