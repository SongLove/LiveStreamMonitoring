import { NormalizedAnchorProfile } from './provider.types';
export type ParsedDouyinBits = {
    nickname: string;
    avatarUrl: string;
    secUid: string;
    uniqueId: string;
};
export declare function extractUserFromJson(payload: unknown, fallbackId?: string): ParsedDouyinBits | null;
export declare function parseDouyinProfileFromHtml(html: string, fallbackId?: string): ParsedDouyinBits | null;
export declare function extractEscapedLiveAnchor(html: string, uniqueId: string): ParsedDouyinBits | null;
export declare function toNormalizedProfile(bits: ParsedDouyinBits, fallbackId: string): NormalizedAnchorProfile;
export declare function hasAvatar(bits: {
    avatarUrl?: string;
} | null | undefined): boolean;
export declare function extractOgImage(html: string): string;
