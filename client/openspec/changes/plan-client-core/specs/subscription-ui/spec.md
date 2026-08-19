## Purpose

订阅关系在 Client 侧的操作：列表项单主播开关、备注、排序、取消监听与批量开关/归类（V1.1）。

## ADDED Requirements

### Requirement: Per-anchor notify switch
用户 MUST 可在首页或详情切换单主播提醒开关，调用 PATCH `/subscriptions/:id`；关闭后 MUST 立即更新 UI，不删除关系。

#### Scenario: Disable single anchor
- **WHEN** 用户关闭某主播提醒
- **THEN** 该订阅 enabled 为 false，列表展示关闭态

### Requirement: Cancel subscription
取消监听 MUST 调用 DELETE `/subscriptions/:id` 并确认；成功后从当前列表移除。

#### Scenario: Unfollow anchor
- **WHEN** 用户确认取消监听
- **THEN** 订阅删除，分类计数更新

### Requirement: Remark and sort optional
若 Server 支持备注与 sortOrder，Client SHOULD 在详情或长按菜单提供编辑，提交 PATCH。

#### Scenario: Edit remark
- **WHEN** 用户保存备注
- **THEN** PATCH 成功后在列表/详情展示新备注

### Requirement: Batch operations via batch API
批量开关、批量归类 MUST 使用 POST `/subscriptions/batch`（V1.1）；单次操作仍走单条 PATCH/DELETE。

#### Scenario: Batch disable category anchors
- **WHEN** V1.1 用户批量关闭某分类下所有提醒
- **THEN** 一次 batch 请求，全部成功后 UI 同步

### Requirement: Subscription limit surfaced
当 Server 返回监听数量上限错误，Client MUST 展示明确文案，引导管理已有监听或联系帮助。

#### Scenario: Exceed subscription cap
- **WHEN** POST subscriptions 返回上限错误
- **THEN** 用户看到已达上限说明，不能静默失败
