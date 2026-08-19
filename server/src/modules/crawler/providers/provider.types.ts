export type Platform = 'bilibili' | 'douyin';

/** Unified live status — carousel maps to not_live, never to live. */
export type NormalizedLiveStatus = 'live' | 'not_live' | 'carousel' | 'probe_failed';

export interface NormalizedAnchorProfile {
  platform: Platform;
  platformUid: string;
  roomId?: string;
  nickname: string;
  avatarUrl: string;
  profileUrl: string;
}

export interface NormalizedLiveResult {
  platform: Platform;
  platformUid: string;
  status: NormalizedLiveStatus;
  title: string;
  coverUrl: string;
  liveUrl: string;
  startedAt?: Date;
  online?: number;
  provider: string;
  fetchedAt: Date;
  confidence: number;
}

export interface LiveProvider {
  readonly name: string;
  readonly platform: Platform;
  healthCheck(): Promise<{ ok: boolean; detail?: string }>;
  resolve(input: string): Promise<NormalizedAnchorProfile>;
  fetchStatus(uids: string[]): Promise<NormalizedLiveResult[]>;
}
