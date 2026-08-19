## Purpose

负责微信小程序登录换取 openid、签发自有 JWT，以及 Admin 独立认证，确保 Client 与 Admin 鉴权隔离且账号状态可约束业务操作。

## ADDED Requirements

### Requirement: WeChat mini-program login issues owned JWT
系统 MUST 使用微信临时登录凭证换取 openid，创建或更新用户记录，并签发自有 JWT；MUST NOT 向 Client 返回 session_key。

#### Scenario: First-time login creates user
- **WHEN** Client 提交有效微信 code 且 openid 尚不存在
- **THEN** 系统创建用户记录、签发 JWT，且响应不含 session_key

#### Scenario: Repeat login does not duplicate user
- **WHEN** 同一 openid 再次登录
- **THEN** 系统更新最近活跃时间、签发新 JWT，且不创建重复用户

#### Scenario: Invalid code rejected
- **WHEN** 微信 code 无效或已过期
- **THEN** 系统返回业务错误且不签发 JWT

### Requirement: Account status constrains login outcomes
被禁用用户可以登录但 MUST 收到明确业务错误码/状态提示；注销中或已删除用户 MUST NOT 获得可执行业务的正常会话能力（按注销流程约束）。

#### Scenario: Banned user can login but cannot create subscriptions
- **WHEN** 状态为 banned 的用户登录成功并尝试创建新订阅
- **THEN** 系统拒绝创建订阅并返回可识别的业务错误码

### Requirement: Admin authentication is isolated from Client JWT
Admin API MUST 使用独立认证体系（独立 JWT 或独立会话），MUST NOT 接受 Client JWT 访问 Admin 写操作。

#### Scenario: Client JWT cannot access admin APIs
- **WHEN** 使用 Client JWT 调用 Admin 前缀接口
- **THEN** 系统拒绝访问

### Requirement: UserId must come from token
任何涉及用户归属的 Client API MUST 从 JWT 解析 userId，MUST NOT 信任请求体中的 userId。

#### Scenario: Spoofed userId ignored
- **WHEN** Client 在请求体中提交他人 userId
- **THEN** 系统仅以 JWT 中的 userId 执行授权与数据访问
