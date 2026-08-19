## Purpose

主播详情页：公开资料、当前状态、历史开播、用户侧提醒配置，以及从服务通知卡片落地的会话信息展示。

## ADDED Requirements

### Requirement: Detail loads anchor and user subscription context
详情 MUST 调用 `GET /anchors/:id`，展示昵称、头像、平台、平台 ID、直播间链接、liveStatus、标题、封面等；已关注用户 MUST 展示开关、备注、分类编辑入口。

#### Scenario: View subscribed anchor
- **WHEN** 用户打开已关注主播详情
- **THEN** 展示个人提醒开关与所属分类，修改走 PATCH `/subscriptions/:id`

### Requirement: Push notification landing shows session
从服务通知进入时 MUST 支持 query（如 sessionId）优先展示对应开播会话：开播时间、标题、进入直播间入口。

#### Scenario: Open from notify card
- **WHEN** 用户点击推送卡片进入小程序
- **THEN** 详情页突出本场直播信息与跳转按钮

### Requirement: External live room jump with clear disclosure
跳转平台直播间前 MUST 明确提示将离开小程序或打开外部 App/链接；V1 推荐复制链接 + 指引，避免未审核 web-view 风险。

#### Scenario: Tap enter live room
- **WHEN** 用户点击进入直播间
- **THEN** 展示确认或说明后执行 copyLink 或 openExternal 策略（以实现配置为准）

### Requirement: Unsubscribed user can follow from detail
未关注用户 MUST 可在详情页发起关注并进入分类选择流程。

#### Scenario: Follow from detail
- **WHEN** 未关注用户点击关注
- **THEN** 与添加页一致调用 POST `/subscriptions`

### Requirement: Invalid anchor shows graceful message
主播失效或平台不可用时 MUST 展示 Server 返回说明，不自动删除用户监听关系。

#### Scenario: Anchor account invalid
- **WHEN** Server 标记账号可能失效
- **THEN** 详情展示提示，保留用户订阅除非用户主动取消
