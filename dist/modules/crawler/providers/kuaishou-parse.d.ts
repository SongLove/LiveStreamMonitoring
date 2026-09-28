export type ParsedKuaishouProfile = {
    platformUid: string;
    nickname: string;
    avatarUrl: string;
    living: boolean;
};
export declare function extractKuaishouId(raw: string): string;
export declare function parseKuaishouLiveHtml(html: string, fallbackId?: string): ParsedKuaishouProfile | null;
