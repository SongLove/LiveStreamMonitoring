## Purpose

以可插拔 Provider 获取主播公开资料与开播状态，统一归一化结果；B 站走官方批量接口，抖音走可降级链路，并对外部调用限流熔断。

## ADDED Requirements

### Requirement: Providers expose unified capabilities
每个 Provider MUST 支持健康检查、主播解析、状态查询与结果归一化，返回统一字段（稳定 ID、状态、标题、封面、链接、开播时间、在线人数、Provider 名、抓取时间、置信度）。核心业务 MUST NOT 依赖平台原始字段语义。

#### Scenario: Normalized live status for bilibili
- **WHEN** B 站返回 live_status=1
- **THEN** Provider 输出统一「直播中」状态

#### Scenario: Bilibili carousel treated as not live
- **WHEN** B 站返回 live_status=2（轮播）
- **THEN** Provider 归一化为非真实开播（未开播或特殊非推送状态），不得触发开播推送

### Requirement: Douyin status semantics normalized inside provider
抖音状态字段 MUST 在 Provider 内归一化（避免上层处理语义反转）；上层只消费统一状态。

#### Scenario: Douyin room status zero maps to live
- **WHEN** 抖音原始字段表示直播中（如房间状态 0）
- **THEN** Provider 输出统一「直播中」

### Requirement: Douyin uses degradable provider chain
抖音 MUST 支持按优先级降级：第三方付费 API（推荐默认优先）、签名直连（可选自研）、Playwright 浏览器兜底。每层 MUST 有超时、失败计数与熔断；连续失败达阈值 MUST 熔断一段时间。

#### Scenario: Primary failure falls back to next provider
- **WHEN** 高优先级抖音 Provider 超时或失败且未全部熔断
- **THEN** 系统自动尝试下一优先级 Provider

#### Scenario: All douyin providers open circuit without fake offline
- **WHEN** 全部抖音 Provider 失败或熔断
- **THEN** 返回探测失败并告警，不伪造下播/开播

### Requirement: Platform rate limiting before external calls
Worker 调用外部平台前 MUST 申领平台级限流令牌；令牌不足 MUST 延后重入队，不得打穿平台配额。

#### Scenario: Rate limit defers job
- **WHEN** 平台令牌桶不足
- **THEN** 探测任务延迟重试且不发起超限请求

### Requirement: New platform via provider only
新增平台 MUST 仅新增配置、Provider 实现、解析适配与状态映射，MUST NOT 修改订阅、额度、推送、分类与 Client API 业务结构。

#### Scenario: Adding platform does not change quota APIs
- **WHEN** 接入新平台 Provider
- **THEN** 额度与推送 API 契约保持不变
