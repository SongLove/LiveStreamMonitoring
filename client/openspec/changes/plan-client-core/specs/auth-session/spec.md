## Purpose

负责微信小程序登录、自有 JWT 持久化、登录拦截与账号异常状态的用户可见提示。

## ADDED Requirements

### Requirement: WeChat login exchanges code for owned JWT
Client MUST 调用 `uni.login` 获取 code，提交 `POST /api/v1/auth/login`，保存 Server 返回的 JWT；MUST NOT 本地保存 session_key。

#### Scenario: Successful login
- **WHEN** 微信 login 成功且 Server 返回 token
- **THEN** Client 持久化 token 并进入监控首页

#### Scenario: Login failure
- **WHEN** Server 返回错误或网络失败
- **THEN** 展示原因与重试按钮，不进入业务页

### Requirement: Authenticated requests attach JWT
所有需鉴权 API 请求 MUST 在 Header 携带 JWT；token 过期或 401 MUST 触发重新登录流程或统一登出提示。

#### Scenario: Token expired
- **WHEN** API 返回未授权
- **THEN** Client 清除本地 token 并引导登录，不静默失败

### Requirement: Route guard for protected pages
除登录页外，业务页面 MUST 经路由/请求拦截校验登录态；未登录用户 MUST 被引导至登录流程。

#### Scenario: Cold start without token
- **WHEN** 用户无 token 打开监控 Tab
- **THEN** 先完成登录再加载订阅数据

### Requirement: Banned account shows actionable message
当 Server 返回账号封禁等业务状态时，Client MUST 展示明确提示；写操作失败时 MUST 映射业务错误码而非通用「网络错误」。

#### Scenario: Banned user tries to add subscription
- **WHEN** Server 拒绝创建订阅并返回封禁相关错误
- **THEN** 用户看到可理解的账号状态说明
