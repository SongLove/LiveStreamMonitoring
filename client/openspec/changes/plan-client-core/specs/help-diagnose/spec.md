## Purpose

帮助中心：四项自助诊断、FAQ、测试推送与缓存清理，降低客服成本并修复订阅「不再询问」等问题。

## ADDED Requirements

### Requirement: Four self-diagnose actions
帮助中心 MUST 提供：检查订阅权限、发送测试推送、清除通知缓存、清除本地缓存；入口清晰可见。

#### Scenario: Check auth status
- **WHEN** 用户点击检查订阅权限
- **THEN** 调用 `GET /diagnose/auth` 展示各模板状态与修复指引

### Requirement: Test push disclaimer
测试推送 MUST 调用 `POST /notify/test`；按钮旁 MUST 说明测试消息不代表真实开播提醒，结果以 Server 为准。

#### Scenario: Send test notify
- **WHEN** 用户点击测试推送
- **THEN** 展示 loading 与成功/失败原因，不消耗用户额度（由 Server 保证）

### Requirement: Clear server notify cache
清除通知缓存 MUST 调用 `POST /diagnose/clear-cache` 重置服务端授权镜像；UI MUST 区别于清除本地缓存。

#### Scenario: Clear notify cache
- **WHEN** 用户执行清除通知缓存
- **THEN** 调用 Server 接口并提示完成后重新检查权限

### Requirement: FAQ from server
常见问题 SHOULD 从 `GET /help/faq` 拉取，支持后台改文案不发版。

#### Scenario: Load FAQ
- **WHEN** 用户打开帮助 Tab
- **THEN** 展示 Server 配置的 FAQ 列表

### Requirement: Reject repair guidance
FAQ MUST 覆盖：为何不弹窗、为何没收到、状态延迟、需打开微信才看到通知、如何恢复拒收权限；拒收场景 MUST 引导用户前往微信设置开启，不反复弹 subscribe。

#### Scenario: Template rejected state
- **WHEN** diagnose 返回拒收
- **THEN** 帮助页展示图文步骤打开订阅设置，不提供自动弹窗修复
