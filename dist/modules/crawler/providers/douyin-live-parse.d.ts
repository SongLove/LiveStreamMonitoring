import { NormalizedLiveStatus } from './provider.types';
export type ParsedDouyinLive = {
    status: NormalizedLiveStatus;
    title: string;
    coverUrl: string;
    confidence: number;
};
export type DouyinLiveProbeSource = {
    url?: string;
    data: unknown;
};
export declare function roomMatchesTarget(node: Record<string, unknown>, targetWebRid?: string): boolean;
export declare function parseDouyinLivePayload(payload: unknown, targetWebRid?: string): ParsedDouyinLive | null;
export declare function pickDouyinLiveProbe(sources: DouyinLiveProbeSource[], targetWebRid: string): ParsedDouyinLive | null;
