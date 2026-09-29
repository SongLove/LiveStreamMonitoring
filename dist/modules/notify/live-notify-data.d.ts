export declare function buildLiveNotifyData(input: {
    anchorName: string;
    topic: string;
    remark: string;
    time: string;
}): Record<string, {
    value: string;
}>;
export declare function formatSubscribeTime(date?: Date): string;
