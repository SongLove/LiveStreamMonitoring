export const QUEUE_NAMES = {
  POLL_SCHEDULE: 'poll-schedule',
  POLL_EXECUTE: 'poll-execute',
  POLL_CONFIRM: 'poll-confirm',
  NOTIFY_DISPATCH: 'notify-dispatch',
  NOTIFY_SEND: 'notify-send',
  ANCHOR_REFRESH: 'anchor-refresh',
  QUOTA_RECONCILE: 'quota-reconcile',
  METRICS_ROLLUP: 'metrics-rollup',
  DATA_CLEANUP: 'data-cleanup',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const ALL_QUEUE_NAMES = Object.values(QUEUE_NAMES);
