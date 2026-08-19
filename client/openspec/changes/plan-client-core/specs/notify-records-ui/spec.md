## Purpose

推送记录二级页：展示用户收到的推送历史及可理解的状态与跳过原因。

## ADDED Requirements

### Requirement: Notify logs list
页面 MUST 调用 `GET /notify/logs` 展示主播、平台、开播时间、推送时间、状态。

#### Scenario: Open notify logs
- **WHEN** 用户从首页或帮助进入推送记录
- **THEN** 分页展示历史记录

### Requirement: Human-readable skip reasons
状态 MUST 至少覆盖：待发送、已发送、已送达、失败、跳过；跳过原因（额度不足、免打扰、关闭提醒、拒收等）MUST 映射为用户可理解中文，不暴露 stack trace。

#### Scenario: Skipped due to quiet hours
- **WHEN** 记录 skipReason 为 DND
- **THEN** 展示「免打扰时段内未推送」类文案

### Requirement: Link to help from failures
失败或跳过条目 SHOULD 提供「为什么没有收到」帮助入口。

#### Scenario: Failed delivery
- **WHEN** 状态为失败
- **THEN** 展示原因并链接帮助中心相关 FAQ

### Requirement: No client-side log fabrication
Client MUST NOT 本地伪造推送记录；离线时 MAY 展示缓存并标注可能不是最新。

#### Scenario: Offline view
- **WHEN** 无网络打开推送记录
- **THEN** 展示离线提示或缓存数据并标明 stale
