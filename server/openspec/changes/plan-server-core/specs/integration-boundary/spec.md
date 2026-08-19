## Purpose

定义服务端自研与第三方的选用边界，以及 AI/Agent 在实现阶段可调用、可修改与禁止触达的范围，避免重复造轮子与越权实现。

## ADDED Requirements

### Requirement: Prefer third-party for commodity infrastructure
下列能力 MUST 优先采用成熟第三方或官方生态，禁止从零自研等价框架：NestJS Config/Mongoose/BullMQ/Throttler/Swagger/Terminus、Redis+BullMQ 队列、Bull Board（或同类）队列面板、结构化日志库、对象存储 SDK、节假日日历数据源、微信官方 HTTP API。

#### Scenario: Queue monitoring uses existing board
- **WHEN** 需要队列可视化
- **THEN** 集成 Bull Board（或同类现成方案），不自研完整队列控制台

### Requirement: Douyin probing prefers paid API before custom signing
V1/V1.1 抖音状态探测 MUST 将第三方付费状态 API 作为默认可依赖路径之一；自研签名直连为可选增强，Playwright 为兜底。业务连续性 MUST NOT 绑定单一自研签名算法。

#### Scenario: Early delivery uses third-party douyin status
- **WHEN** 自研签名链路尚未稳定
- **THEN** 系统仍可通过第三方 Provider 完成状态探测闭环

### Requirement: AI and agents must not invent product features outside specs
AI/Agent 实现本变更时 MUST 仅实现已规格化能力与 tasks；MUST NOT 擅自加入直播内容抓取、弹幕分析、手机号采集、社交聊天、推荐算法或长期订阅消息模型。

#### Scenario: Out-of-scope feature request refused in implementation
- **WHEN** 实现过程中出现「抓取弹幕」类需求且不在本变更 specs
- **THEN** 不得作为本变更一部分落地，需另开 change

### Requirement: AI call boundary for external model usage
Server 业务运行时 V1 MUST NOT 依赖大模型推理完成开播判定、额度发放或推送决策。若未来引入 LLM，仅可用于非权威辅助（如帮助文案生成、运维摘要），且 MUST NOT 成为额度/开播/权限的权威来源。

#### Scenario: Live decision does not call LLM
- **WHEN** Worker 判定开播或下发推送
- **THEN** 决策仅基于 Provider 归一化状态、状态机与业务校验链，不调用大模型

### Requirement: Secrets and credentials stay out of AI-visible logs and client responses
实现与排障输出 MUST NOT 将 session_key、平台 Cookie、签名完整参数、JWT 原文写入普通日志或返回给 Client/普通 Admin 视图。

#### Scenario: Debug response redacts credentials
- **WHEN** Provider 调试需要保留原始响应
- **THEN** 仅短期脱敏存储，且不对 Client 暴露

### Requirement: Buy-vs-build decisions are documented and enforceable in tasks
tasks 与实现清单 MUST 标注采用的第三方组件；若某项改为自研，MUST 先更新本能力规格或 design 决策后再实现。

#### Scenario: Replacing BullMQ requires design update
- **WHEN** 有人提议自研队列替代 BullMQ
- **THEN** 不得直接改代码，须先修订 integration-boundary/design 并获确认
