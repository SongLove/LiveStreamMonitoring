## Purpose

提供基于 unibest 内置能力的统一 HTTP 客户端：鉴权、traceId、错误映射、幂等防重复提交与有限重试。

## ADDED Requirements

### Requirement: Single request wrapper for all APIs
所有 Server 调用 MUST 经统一请求封装（unibest 内置或在其上扩展），统一 baseURL、超时、JSON 解析与错误处理；禁止页面内 scattered 裸 `uni.request`。

#### Scenario: Call subscriptions list
- **WHEN** 监控首页加载监听列表
- **THEN** 通过 api 模块调用 `GET /subscriptions`，而非页面直接 uni.request

### Requirement: Response follows server envelope
Client MUST 解析 Server 统一响应体（含业务 code、message、traceId）；对用户可见错误 MUST 映射为中文说明，不暴露堆栈。

#### Scenario: Business validation error
- **WHEN** Server 返回分类重名等业务错误
- **THEN** Toast 或表单提示展示 message，保留用户输入

### Requirement: Idempotent submit buttons
写操作按钮（关注、保存设置、授权刷新）MUST 在请求进行中禁用或 loading，防止重复提交；依赖 Server 幂等的操作 MUST NOT 连点创建多条。

#### Scenario: Double tap follow
- **WHEN** 用户快速双击关注按钮
- **THEN** 仅发起一次 POST `/subscriptions` 请求

### Requirement: Safe retry for read-only requests
GET 类读请求 MAY 在下拉刷新或网络恢复时自动重试；写请求 MUST NOT 无用户确认自动重试。

#### Scenario: Pull to refresh on home
- **WHEN** 用户下拉刷新监控首页
- **THEN** 重新请求 subscriptions 与 profile，失败可再次手动刷新

### Requirement: API module maps PRD endpoint list
Client MUST 为 PRD 第 7 节所列 `/api/v1/*` 接口提供 typed API 函数或 service 层，路径与 Server OpenSpec 保持一致。

#### Scenario: Add resolve API
- **WHEN** 添加主播页提交分享文案
- **THEN** 调用封装好的 `resolveAnchor(payload)` 对应 `POST /anchors/resolve`
