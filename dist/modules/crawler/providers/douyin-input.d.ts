export type DouyinInputKind = {
    kind: 'search_keyword';
    keyword: string;
} | {
    kind: 'user_id';
    userId: string;
    idType: 'unique_id' | 'sec_uid';
} | {
    kind: 'live_id';
    liveId: string;
} | {
    kind: 'share_text';
    text: string;
};
export declare function isDouyinUniqueId(raw: string): boolean;
export declare function isDouyinSecUid(raw: string): boolean;
export declare function looksLikeDouyinUserId(raw: string): boolean;
export declare function parseDouyinInput(raw: string): DouyinInputKind;
export declare function douyinLiveWebRid(anchor: {
    roomId?: string;
    platformUid?: string;
}): string;
export declare function assertDouyinUserId(uid: string): void;
export declare function assertStableDouyinUid(uid: string): void;
