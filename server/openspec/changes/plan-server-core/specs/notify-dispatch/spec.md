## Purpose

在确认开播后按订阅者执行完整推送校验链，原子扣减额度并调用微信订阅消息下发，记录全生命周期日志以支持排障与额度返还。

## ADDED Requirements

### Requirement: Notify validation chain before WeChat send
推送 Worker MUST 对每个订阅者按固定顺序执行校验：订阅开关、用户状态、总开关、免打扰、学生党模式、仅大号、冷却、逐用户幂等、模板授权、额度余额；任一步失败 MUST 只记录跳过原因且 MUST NOT 消耗额度。

#### Scenario: Quota insufficient skips without deduct
- **WHEN** 用户其余校验通过但余额为 0
- **THEN** 记录次数不足，不调用微信下发，不扣减额度

#### Scenario: Do-not-disturb skips without deduct
- **WHEN** 当前时间处于用户免打扰时段
- **THEN** 记录免打扰中，不扣减额度

### Requirement: Successful path deducts then sends
通过全部校验后，系统 MUST 原子扣减额度、创建 notify_log，再调用微信订阅消息接口；跳转页 MUST 为已发布的直播详情页路径。

#### Scenario: Happy path creates notify log
- **WHEN** 用户通过全部校验且微信同步返回成功
- **THEN** 额度减一，notify_log 记录已发送并等待异步回执

### Requirement: Error codes decide retry or refund
系统 MUST 按微信错误码策略处理：43101/47003/41030 等返还额度；40001 强制刷新 token 后重试不返还；45009 延迟重试不返还。

#### Scenario: User reject error refunds
- **WHEN** 同步返回 43101
- **THEN** 返还额度并标记模板授权失效

#### Scenario: Access token invalid retries without refund
- **WHEN** 同步返回 40001
- **THEN** 强制刷新 access_token 后重试，不因该错误直接返还额度

### Requirement: Per user per session per template idempotency
同一用户对同一 sessionId 与 templateId MUST 最多成功推送一次；重复任务 MUST 幂等跳过。

#### Scenario: Duplicate notify job ignored
- **WHEN** 同一用户同一开播会话的发送任务被投递两次
- **THEN** 仅一次实际扣减与下发

### Requirement: Async receipt updates final status
微信异步下发结果回执到达后，系统 MUST 回填推送最终状态；符合返还规则的失败 MUST 返还额度。

#### Scenario: Async failure refunds when policy matches
- **WHEN** 异步回执表明系统失败且策略要求返还
- **THEN** 额度返还且日志状态更新为失败可解释原因
