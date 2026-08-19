## Purpose

以微信订阅事件回调为唯一权威凭证管理一次性订阅额度：账本只追加、余额快照原子扣减/返还，防止 Client 伪造发放并支撑推送对账。

## ADDED Requirements

### Requirement: Only WeChat subscribe callback can grant quota
额度发放的唯一入口 MUST 是微信服务器推送的订阅结果回调；Client 任何「增加次数」请求 MUST NOT 直接增加额度。`POST /quota/refresh` 只查询不同步发放。

#### Scenario: Accept callback grants one quota
- **WHEN** 微信回调表明用户对指定模板 accept
- **THEN** 系统按幂等键发放一条对应额度并更新余额快照（不超过上限）

#### Scenario: Client forge grant rejected
- **WHEN** Client 调用接口试图直接增加额度
- **THEN** 系统不增加额度

### Requirement: Callback list field must normalize object or array
系统 MUST 将微信回调中单对象与数组两种列表格式归一化处理，避免单模板场景失败。

#### Scenario: Single-object callback accepted
- **WHEN** 回调列表字段为单个对象而非数组
- **THEN** 系统仍正确解析并处理订阅结果

### Requirement: Ledger append-only with unique idempotency key
发放、扣减、返还、后台调整 MUST 写入 `quota_ledger`，使用唯一幂等键；余额读取走 `user_quota` 快照。

#### Scenario: Duplicate WeChat callback does not double grant
- **WHEN** 微信重试投递同一订阅事件
- **THEN** 额度只增加一次

### Requirement: Atomic deduct when balance greater than zero
扣减 MUST 使用条件更新原子完成「余额>0 才扣减」；不足时 MUST NOT 扣减。

#### Scenario: Concurrent deduct never goes negative
- **WHEN** 同一用户并发触发多次扣减且余额仅够一次
- **THEN** 仅一次扣减成功，其余失败且余额不为负

### Requirement: Reject event updates auth and blocks send
用户拒收模板时，系统 MUST 更新授权状态镜像并阻止继续发送；符合返还规则的失败 MUST 返还额度。

#### Scenario: Reject clears grant path
- **WHEN** 收到用户拒收模板事件
- **THEN** 对应模板授权状态更新为不可发送，后续推送在授权校验处跳过
