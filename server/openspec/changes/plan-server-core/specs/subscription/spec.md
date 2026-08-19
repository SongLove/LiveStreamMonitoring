## Purpose

管理用户与全局主播的关注关系及个人配置（开关、备注、排序、分类归属），保证幂等添加与批量操作，并为推送分发提供启用订阅者列表。

## ADDED Requirements

### Requirement: Subscriptions unique per user and anchor
系统 MUST 以 `userId + anchorId` 唯一约束订阅；重复添加 MUST 幂等，不得产生重复订阅。

#### Scenario: Retry add does not duplicate
- **WHEN** Client 因网络重试对同一主播重复提交添加监听
- **THEN** 仅保留一条订阅记录

#### Scenario: Re-enable soft-disabled subscription
- **WHEN** 用户对已关闭或软删除的订阅再次添加同一主播
- **THEN** 系统恢复为启用状态而不是新建重复记录

### Requirement: Only owning user can mutate subscription
订阅查询与修改 MUST 仅限本人；banned 用户 MUST NOT 创建新订阅。

#### Scenario: Patch another user subscription forbidden
- **WHEN** 用户 A 尝试修改用户 B 的订阅
- **THEN** 系统拒绝

### Requirement: Batch operations respect limits and ownership
批量开关/归类 MUST 校验数量上限、订阅归属与分类归属。

#### Scenario: Batch categorize with foreign category rejected
- **WHEN** 用户提交不属于自己的 categoryId 做批量归类
- **THEN** 系统拒绝该请求

### Requirement: Cancel listen soft-deletes
取消监听 MUST 软删除订阅关系，保留必要历史推送关联；关注数变化可触发主播 pollTier 重算。

#### Scenario: Delete subscription soft-deletes
- **WHEN** 用户取消监听某主播
- **THEN** 订阅不再出现在启用列表中，且不物理破坏历史推送关联所需引用
