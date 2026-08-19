## Purpose

定义 Client 端自研与第三方的选用边界，以及 AI/Agent/MCP 在实现阶段可调用、可修改与禁止触达的范围，避免重复造轮子与越权实现。

## ADDED Requirements

### Requirement: Prefer unibest and Wot UI for app foundation
Client 工程 MUST 基于 unibest（create-unibest）脚手架初始化，UI MUST 使用 @wot-ui/ui（Wot UI v2）；禁止从零搭建等价 uni-app 工程或自研全量 UI 组件库。

#### Scenario: New project uses unibest template
- **WHEN** 初始化 client 工程
- **THEN** 使用 unibest 约定式路由、内置请求封装与 Wot UI v2，而非裸 uni-preset-vue

### Requirement: Client must not call platform live APIs directly
Client MUST NOT 直接请求抖音、哔哩哔哩或其他直播平台的开播/解析接口；主播搜索、链接解析、开播状态 MUST 仅通过 Server `/api/v1` 获取。

#### Scenario: Paste douyin share text
- **WHEN** 用户粘贴抖音分享文案
- **THEN** Client 将原文提交 `/anchors/resolve`，不在本地正则解析 sec_uid 或判断开播

### Requirement: Quota and live state are never client-authoritative
Client MUST NOT 在本地递增推送额度、伪造开播状态或绕过 Server 校验链结果；额度展示 MUST 来自 Server 接口响应。

#### Scenario: After subscribe message accept
- **WHEN** 用户在微信弹窗中点击接受
- **THEN** Client 仅调用 `/quota/refresh` 与 profile 查询刷新展示，不执行本地 balance + 1

### Requirement: Subscribe message only on explicit user tap
`wx.requestSubscribeMessage` MUST 仅在用户主动点击按钮后调用；MUST NOT 在 onLaunch、onShow 或页面进入时自动弹出。

#### Scenario: First open app
- **WHEN** 用户首次进入监控首页
- **THEN** 不自动弹出订阅授权窗口

### Requirement: AI and agents must not invent product features outside specs
AI/Agent 实现本变更时 MUST 仅实现已规格化能力与 tasks；MUST NOT 擅自加入平台 Cookie 存储、本地开播判定、付费会员页、长期订阅或弹幕功能。

#### Scenario: Out-of-scope local live detection
- **WHEN** 实现过程中提议在 Client 轮询 B 站接口判断开播
- **THEN** 不得落地，须通过 Server 订阅列表接口展示状态

### Requirement: AI call boundary for external model usage
Client 业务运行时 V1 MUST NOT 依赖大模型推理完成开播展示、额度计算或推送决策。LLM 仅可用于研发辅助（文档摘要、样板代码），且 MUST NOT 成为产品运行时逻辑。

#### Scenario: List rendering does not call LLM
- **WHEN** 监控首页渲染主播列表
- **THEN** 状态字段仅绑定 Server 返回的 liveStatus，不调用 AI 推断

### Requirement: Secrets stay out of client bundle and logs
JWT、微信模板 ID、内部 trace 细节 MUST NOT 硬编码多环境密钥于源码；日志 MUST NOT 输出完整 token 或 session_key。

#### Scenario: Production build
- **WHEN** 构建生产包
- **THEN** 敏感配置来自环境或 `/config/app`，且不打印 token 到 console

### Requirement: Analytics uses third-party or WeChat official where possible
行为埋点 SHOULD 使用微信 we 分析、友盟+ 等成熟 SDK 或 Server 聚合接口之一；禁止为 V1 自研完整埋点采集与大盘系统。

#### Scenario: Track add anchor success
- **WHEN** 用户成功添加监听
- **THEN** 通过选定 SDK 或 Server 上报事件，不在本地自建 analytics 服务
