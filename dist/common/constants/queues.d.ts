export declare const QUEUE_NAMES: {
    readonly POLL_SCHEDULE: "poll-schedule";
    readonly POLL_EXECUTE: "poll-execute";
    readonly POLL_CONFIRM: "poll-confirm";
    readonly NOTIFY_DISPATCH: "notify-dispatch";
    readonly NOTIFY_SEND: "notify-send";
    readonly ANCHOR_REFRESH: "anchor-refresh";
    readonly QUOTA_RECONCILE: "quota-reconcile";
    readonly METRICS_ROLLUP: "metrics-rollup";
    readonly DATA_CLEANUP: "data-cleanup";
};
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
export declare const ALL_QUEUE_NAMES: ("poll-schedule" | "poll-execute" | "poll-confirm" | "notify-dispatch" | "notify-send" | "anchor-refresh" | "quota-reconcile" | "metrics-rollup" | "data-cleanup")[];
