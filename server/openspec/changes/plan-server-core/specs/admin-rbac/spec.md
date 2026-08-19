## Purpose

为运营与客服提供独立 Admin API：RBAC、用户/主播/推送只读排障、额度调整与补发等写操作审计，且默认不代改用户 DIY 分类与关注关系。

## ADDED Requirements

### Requirement: Admin APIs use RBAC with default deny
Admin 接口 MUST 基于角色权限控制；未配置权限默认拒绝。角色至少区分超级管理员、用户支持、内容运营、运维审计。

#### Scenario: Content ops cannot view private user categories
- **WHEN** 内容运营角色请求用户私有分类详情
- **THEN** 系统拒绝（除非另有明确授权）

### Requirement: User support read-only for categories and subscriptions
第一版 Admin MUST 允许只读查看用户关注主播、个人分类、额度与推送记录；MUST NOT 默认允许替用户创建/删除/移动分类或改关注关系。

#### Scenario: Admin cannot mutate user category
- **WHEN** 管理员调用代改用户分类的写接口（若未开放）
- **THEN** 系统拒绝或不提供该能力

### Requirement: High-risk writes require reason and audit log
额度人工调整、封禁解封、补发、系统配置修改 MUST 记录操作人、对象、前后摘要、原因与时间。

#### Scenario: Manual quota adjust audited
- **WHEN** 超级管理员调整用户额度并填写原因
- **THEN** 账本写入调整记录且 audit_logs 留痕

### Requirement: Openid masked in admin lists
后台用户列表默认 MUST 脱敏展示 openid；敏感凭证 MUST NOT 出现在普通 Admin 页面响应中。

#### Scenario: User list shows masked openid
- **WHEN** 用户支持查看用户列表
- **THEN** openid 以脱敏形式展示

### Requirement: Provider credentials not fully exposed
Admin 可查看 Provider 健康与配置摘要，MUST NOT 在普通页面展示完整 Cookie/签名凭证。

#### Scenario: Provider ops page hides full secrets
- **WHEN** 运维查看探测器状态
- **THEN** 仅见健康指标与摘要，不见完整凭证
