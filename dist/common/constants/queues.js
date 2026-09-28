"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_QUEUE_NAMES = exports.QUEUE_NAMES = void 0;
exports.QUEUE_NAMES = {
    POLL_SCHEDULE: 'poll-schedule',
    POLL_EXECUTE: 'poll-execute',
    POLL_CONFIRM: 'poll-confirm',
    NOTIFY_DISPATCH: 'notify-dispatch',
    NOTIFY_SEND: 'notify-send',
    ANCHOR_REFRESH: 'anchor-refresh',
    QUOTA_RECONCILE: 'quota-reconcile',
    METRICS_ROLLUP: 'metrics-rollup',
    DATA_CLEANUP: 'data-cleanup',
};
exports.ALL_QUEUE_NAMES = Object.values(exports.QUEUE_NAMES);
//# sourceMappingURL=queues.js.map