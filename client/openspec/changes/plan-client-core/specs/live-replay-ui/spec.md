## Purpose

直播回放 Tab：展示历史开播会话，支持筛选与详情，回放链接以 Server 返回为准。

## ADDED Requirements

### Requirement: Session list from live API
回放页 MUST 调用 `GET /live/sessions` 展示历史会话：主播、平台、开播/结束时间、标题、封面、时长。

#### Scenario: Load replay tab
- **WHEN** 用户进入直播回放 Tab
- **THEN** 分页或滚动加载会话列表

### Requirement: Replay link only when server provides
若 Server 未返回有效回放链接，MUST NOT 展示无效跳转按钮；仅展示历史记录信息。

#### Scenario: No replay URL
- **WHEN** 会话无 platformReplayUrl
- **THEN** 隐藏「看回放」或展示不可用说明

### Requirement: Filter by platform anchor category time
V1.1 SHOULD 支持按平台、主播、分类、时间筛选；筛选参数 MUST 传给 Server query，不在 Client 全量过滤大数据集。

#### Scenario: Filter bilibili only
- **WHEN** V1.1 用户选择 B 站筛选
- **THEN** 请求带 platform 参数重新拉取列表

### Requirement: Navigate to anchor detail from session
点击会话条目 SHOULD 跳转主播详情并携带 session 上下文。

#### Scenario: Tap session row
- **WHEN** 用户点击某条历史开播
- **THEN** 进入详情或会话详情展示该场信息
