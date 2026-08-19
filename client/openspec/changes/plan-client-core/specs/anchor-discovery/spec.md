## Purpose

添加主播与主播广场：搜索、链接解析、平台选择、推荐关注与个人分类选择，帮助用户发现并完成监听关系创建。

## ADDED Requirements

### Requirement: Add anchor supports douyin and bilibili
添加页 MUST 支持平台切换（抖音、哔哩哔哩），影响输入提示；搜索调用 `GET /anchors/search`，粘贴解析调用 `POST /anchors/resolve`。

#### Scenario: Resolve bilibili room link
- **WHEN** 用户粘贴合法 B 站直播间链接
- **THEN** Server 返回主播资料与当前状态，Client 展示确认页

#### Scenario: Resolve invalid link
- **WHEN** Server 返回解析失败
- **THEN** 展示具体原因（无效链接、不存在、风控等），保留输入内容

### Requirement: Follow flow includes category selection
用户确认关注 MUST 调用 `POST /subscriptions`；弹出分类选择，支持已有分类、新建分类或跳过（未分类）；重复关注 MUST NOT 创建 duplicate 订阅。

#### Scenario: Already subscribed
- **WHEN** 用户对已关注主播再次关注
- **THEN** 展示已关注状态，允许进入详情或修改分类

### Requirement: Search history is non-sensitive
MAY 保留最近搜索关键词本地缓存；MUST NOT 默认保存或上传剪贴板全文敏感内容。

#### Scenario: Recent search display
- **WHEN** 用户再次打开搜索
- **THEN** 可展示近期关键词列表，用户可清除

### Requirement: Anchor square shows server recommendations
主播广场 MUST 从 `GET /anchors/pool` 拉取推荐专题与主播；展示推荐理由、状态与关注标记；后台下架内容 MUST NOT 展示。

#### Scenario: Follow from square
- **WHEN** 用户在广场点击关注
- **THEN** 弹出个人分类选择，MUST NOT 自动用专题名创建用户分类

### Requirement: Square analytics events
广场曝光、点击、关注 SUCCESS SHOULD 上报 analytics（见 analytics-events），不含 openid 等敏感字段。

#### Scenario: Click recommendation card
- **WHEN** 用户点击推荐主播卡片
- **THEN** 触发推荐点击埋点并进入详情或关注流程

### Requirement: V1 scope for square
V1 MAY 以简化广场或占位页交付；完整推荐专题能力标注 V1.1，但接口契约 MUST 与 Server 一致预留。

#### Scenario: V1 minimal square
- **WHEN** V1 仅实现基础列表
- **THEN** 仍消费 `/anchors/pool`，不 mock 假数据
