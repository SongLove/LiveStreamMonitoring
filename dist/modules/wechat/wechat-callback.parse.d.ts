export type WechatSubscribeEventItem = {
    templateId: string;
    status: string;
    popupScene?: string;
};
export type ParsedWechatCallback = {
    event: string;
    fromUserName: string;
    createTime: string;
    items: WechatSubscribeEventItem[];
    encrypted: boolean;
};
export declare function parseWechatCallbackBody(raw: unknown): ParsedWechatCallback;
