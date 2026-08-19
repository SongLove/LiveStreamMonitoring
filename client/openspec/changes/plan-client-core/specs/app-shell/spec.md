## Purpose

提供 uni-app 微信小程序工程骨架、五 Tab 信息架构、全局布局、远程配置与统一异常体验，作为所有业务页面的运行容器。

## ADDED Requirements

### Requirement: Five-tab primary navigation matches PRD
小程序 MUST 提供五个底部 Tab：监控、主播广场、直播回放、设置、帮助中心；Tab 切换 MUST NOT 丢失已登录会话（token 有效前提下）。

#### Scenario: User switches tabs
- **WHEN** 用户在五个 Tab 间切换
- **THEN** 各 Tab 对应独立页面栈或约定式路由入口，且导航标签与 PRD 一致

### Requirement: Remote app config from server
Client MUST 支持拉取 `GET /config/app` 并缓存功能开关、公告、版本提示与订阅模板 ID 等配置；配置变更 SHOULD 在不发版情况下生效（下次启动或定时刷新）。

#### Scenario: Feature flag disables square
- **WHEN** Server 下发关闭主播广场开关
- **THEN** Client 隐藏或禁用广场 Tab/入口并展示说明（若配置含文案）

### Requirement: Global loading empty and error states
所有一级页面 MUST 覆盖骨架屏/加载中、空数据、网络失败与权限失败态；MUST NOT 长期停留空白页。

#### Scenario: Home API timeout
- **WHEN** 监控首页首屏接口超时
- **THEN** 展示重试入口与错误说明，而非白屏

### Requirement: Subpackages or lazy routes for secondary pages
添加主播、详情、分类管理、推送记录、增加次数等二级页面 SHOULD 使用分包或 lazy 路由以控制主包体积。

#### Scenario: Open add anchor page
- **WHEN** 用户从首页进入添加主播
- **THEN** 通过二级路由打开，不影响 Tab 栏状态定义

### Requirement: Layout and theme use Wot UI tokens
全局 layout、导航栏、TabBar 样式 MUST 基于 Wot UI 与设计 token，保持与 PRD 截图参考一致的可读性与开播态高亮能力。

#### Scenario: Live anchor highlight
- **WHEN** 列表项 liveStatus 为直播中
- **THEN** 使用约定样式组件（如 tag/badge）醒目展示，样式来自 Wot UI 而非内联硬编码散落
