## Purpose

非敏感行为埋点与 PRD 第 9 节产品指标的数据采集，优先第三方 SDK，不上报 openid/手机号等敏感信息。

## ADDED Requirements

### Requirement: Core events tracked
Client MUST 上报（或经 Server 聚合）以下事件：首次打开、登录成功、搜索主播、解析成功、关注成功、分类创建/删除、推荐点击/关注、授权按钮点击、授权后 refresh、帮助入口、测试推送点击、推送卡片进详情。

#### Scenario: Follow success event
- **WHEN** POST subscriptions 成功
- **THEN** 触发 follow_success 类事件，payload 不含 openid

### Requirement: No sensitive fields in analytics
埋点 MUST NOT 包含 openid、JWT、剪贴板全文、平台 Cookie、手机号、定位。

#### Scenario: Resolve anchor event
- **WHEN** 上报解析成功
- **THEN** 仅含 platform、来源类型（search/link），不含用户粘贴全文

### Requirement: Third-party or server aggregation preferred
实现 SHOULD 使用 we 分析、友盟+ 或 Server 埋点接收端之一；V1 MUST NOT 自建完整采集后端。

#### Scenario: Choose analytics provider
- **WHEN** 工程初始化
- **THEN** 接入一种 documented SDK 或 POST 至 Server 统计接口（若 Server 提供）

### Requirement: Metrics align with PRD section 9
实现 SHOULD 支持计算或上报 PRD 指标所需的原始事件：首次添加成功率、授权点击率、授权接受率、分类使用率、推荐转化、帮助 FAQ 点击排行。

#### Scenario: Auth button click rate
- **WHEN** 用户点击额度区授权按钮
- **THEN** 记录 auth_button_click 供漏斗分析
