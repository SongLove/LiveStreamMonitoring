## Purpose

用 BullMQ 等队列将探测、确认、推送与对账异步解耦，按 pollTier 分层调度，保证任务幂等、可重试且不阻塞 Client API。

## ADDED Requirements

### Requirement: API process does not perform heavy probing
API 进程 MUST NOT 在用户请求线程中执行耗时平台探测；探测与推送 MUST 由 Worker 消费队列完成。

#### Scenario: Resolve may call provider but poll stays in worker
- **WHEN** 用户添加主播需要解析
- **THEN** 解析可在受控限流下完成；持续轮询探测仍由调度队列驱动而非每个 API 长轮询

### Requirement: Tiered polling schedule
调度 MUST 按 pollTier 与 lastPolledAt 扫描到期主播，按平台批量投递；热门/普通/冷门/暂停间隔 MUST 可配置。

#### Scenario: Due anchors enqueued by platform batches
- **WHEN** 周期调度触发且存在到期主播
- **THEN** 系统按平台分组投递 poll-execute 任务且调度扫描有分布式锁防重复

### Requirement: Required queues exist with failure strategies
系统 MUST 提供至少以下队列职责：poll-schedule、poll-execute、poll-confirm、notify-dispatch、notify-send、anchor-refresh、quota-reconcile、metrics-rollup、data-cleanup；可重试错误指数退避，不可重试错误终止。

#### Scenario: Notify send retries transient errors
- **WHEN** notify-send 遇到可重试错误
- **THEN** 任务按退避策略重试且不超过配置次数

### Requirement: Jobs carry safe observability metadata
任务 MUST 包含 traceId、jobId、业务幂等键、起止时间、重试次数与最终状态；MUST NOT 记录 session_key、Cookie、完整签名参数或明文 openid。

#### Scenario: Job log omits secrets
- **WHEN** 探测或推送任务失败写日志
- **THEN** 日志含 trace/job 标识与错误分类，不含敏感凭证全文
