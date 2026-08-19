# 主播开播监控服务端 PRD：Server 端

**文档版本**：V1.0
**编制日期**：2026 年 8 月 19 日
**技术栈**：NestJS + Mongoose + MongoDB + Redis + BullMQ
**部署形态**：Docker Compose，自有服务器，API 与 Worker 可独立启动
**服务对象**：Client 微信小程序、Admin 管理后台、微信开放接口、抖音/B站平台 Provider

---

## 1. 文档说明

本 PRD 定义主播开播监控系统的服务端职责、业务模块、数据模型、队列、平台探测、微信订阅消息、API、权限、安全、异常处理和验收标准。Server 是整个系统的业务权威层：负责保存数据、判断权限、调度任务、探测主播、判定开播、管理推送额度、调用微信接口，并向 Client 和 Admin 提供统一 API。

Server 不负责页面渲染，不负责后台页面交互，不把平台原始数据直接暴露给 Client，不允许 Client 直接修改额度或开播状态。Admin 也不能绕过 Server 直接读写 MongoDB。

---

## 2. 产品目标与边界

### 2.1 目标

Server 需要稳定完成以下核心闭环：用户登录后添加主播；服务端对全局主播去重并持续探测；检测到未开播转为直播中后生成唯一开播会话；根据用户订阅关系、推送设置、免打扰、授权状态和额度进行校验；通过微信订阅消息发送提醒；记录完整的推送结果并支持后台排障。

### 2.2 非目标

Server V1 不实现直播内容抓取、弹幕分析、录播下载、用户关系链分析、用户手机号收集、社交聊天和复杂的推荐算法。抖音和 B 站只获取公开的主播资料与开播状态，不存储与提醒业务无关的直播内容。

### 2.3 服务端必须遵守的原则

| 原则 | 具体要求 |
|---|---|
| 权威性 | 额度、开播状态、订阅关系和权限以 Server 数据为准 |
| 全局去重 | 同一平台同一主播只创建一个全局主播实体，只探测一次 |
| 异步解耦 | 外部探测和推送不能阻塞普通 API 请求 |
| 幂等 | 登录、添加订阅、额度发放、额度扣减、开播会话和推送任务都必须支持幂等 |
| 可扩展 | 新增平台只新增 Provider，不修改核心业务流程 |
| 可降级 | 抖音 Provider 失败时可以自动切换浏览器或第三方 Provider |
| 最小权限 | Client 和 Admin 只能调用自己被授权的接口 |
| 可审计 | 额度调整、封禁、补发、配置修改等后台操作必须记录审计日志 |

---

## 3. Server 端总体架构

### 3.1 服务组成

| 服务 | 职责 | 是否对公网 |
|---|---|---|
| API Service | Client/Admin API、微信回调、认证、业务读写 | 是，通过 Nginx 暴露 |
| Worker Service | 调度、平台探测、状态判定、推送、对账、指标聚合 | 否，只访问内网和外部平台 |
| Crawler Service | 可选；承载 Playwright 或 Python 抖音 Provider | 否，仅 Worker 调用 |
| MongoDB | 持久化业务数据、账本、日志和会话 | 否，仅内网 |
| Redis | 队列、缓存、锁、限流、状态快照 | 否，仅内网 |
| Nginx | HTTPS、路由、限流、微信回调转发 | 是 |

API 和 Worker 使用同一套 NestJS 领域模块、Schema、配置和基础服务，但使用不同启动入口。API 进程不执行耗时探测；Worker 进程不直接提供面向用户的业务接口。

### 3.2 建议目录职责

| 模块 | 职责 |
|---|---|
| auth | 微信登录、JWT、Admin 登录、RBAC |
| user | 用户资料、设置、账号状态 |
| anchor | 公共主播池、链接解析、搜索、资料刷新 |
| category | 用户 DIY 分类及分类关系 |
| subscription | 用户关注关系、单主播开关、批量操作 |
| quota | 订阅额度、账本、原子扣减、返还、对账 |
| live | 开播会话、历史记录、直播详情 |
| notify | 推送校验链、模板渲染、发送、回执 |
| wechat | access_token、code2Session、订阅消息、微信事件回调 |
| crawler | Provider 注册、链路降级、熔断、限流 |
| scheduler | BullMQ 队列、周期调度、任务分片 |
| recommendation | 主播广场公共推荐内容和转化统计 |
| admin | 后台 API、RBAC、审计和运营动作 |
| metrics | 指标采集、聚合、健康检查和告警 |

---

## 4. 核心业务流程

### 4.1 用户登录

Client 发送微信临时登录凭证，Server 调微信登录接口换取 openid，创建或更新用户记录，签发自有 JWT。Server 只保存必要的 openid 及用户业务状态，不向 Client 返回 session_key。重复登录只更新最近活跃时间，不创建重复用户。

登录需要支持令牌过期、主动退出、账号禁用和注销中状态。被禁用用户可以登录但不能创建新的订阅和触发推送，具体提示由 Server 返回业务错误码。

### 4.2 添加主播

用户提交平台和关键词、平台 ID、直播间链接或分享文案。Server 先进行输入归一化，再调用对应 Provider 的主播解析能力。解析成功后，以 `platform + platformUid` 为全局唯一键创建或复用主播记录，随后创建当前用户的 subscription。若用户同时传入分类，Server 校验分类属于当前用户；没有分类时进入未分类视图。

添加主播不能因为 Client 重试而产生重复订阅。Server 使用用户与主播的联合唯一约束处理重复请求；已经存在但处于关闭状态的订阅，可以恢复为启用，而不是创建新记录。

### 4.3 用户 DIY 分类

分类属于用户私有业务数据。Server 保存分类名称、颜色、图标、排序、创建时间、删除状态和分类与订阅主播的关系。一个主播可以属于同一用户的多个分类；分类不能跨用户访问。

删除分类只移除分类关系，不能删除全局主播，也不能自动取消用户监听。删除后关联主播进入未分类视图。分类操作必须校验用户身份、分类归属、名称长度、同用户重名和分类数量上限。

### 4.4 订阅消息授权与额度

Client 只能发起微信订阅授权和查询余额。用户在微信弹窗中接受授权后，微信服务器向 Server 回调订阅事件，Server 以回调中的 openid、模板 ID、订阅结果和事件时间生成幂等键，只有接受结果才能发放一条对应额度。

Server 必须处理单对象和数组两种回调格式，避免单模板场景异常。用户在服务通知中拒收模板时，Server 更新授权状态并阻止继续发送。微信异步发送回执到达后，Server 回填推送状态；符合返还规则的失败需要返还额度。

额度使用账本追加记录，余额使用快照读取。发放、扣减、返还和后台调整都必须写入 `quota_ledger`，并使用唯一幂等键。任何来自 Client 的“增加次数”参数都不能直接修改额度。

### 4.5 主播状态探测

Scheduler 按 `pollTier` 和 `lastPolledAt` 扫描到期主播，以平台和批量大小分组，向 poll-execute 队列投递任务。Worker 申领 Redis 限流令牌后调用 Provider，得到统一格式的状态结果。

B 站优先使用支持批量查询的官方接口；抖音采用签名直连、Playwright、第三方接口的降级链路。Provider 只负责将平台原始结果转换为统一状态，核心业务不识别平台字段差异。

Server 使用 Redis 快照保存上一次状态，并通过状态机和二次确认进行开播判定。首次发现直播中进入待确认，低置信度结果需要延迟复查；连续确认后生成 live_session。下播需要连续多次未开播才确认，防止网络抖动造成状态反复。

### 4.6 推送分发

确认开播后，Server 创建唯一 live_session 并投递 notify-dispatch。推送 Worker 查询该主播所有启用的订阅关系，按用户逐条执行校验链：订阅开关、用户状态、总开关、免打扰、学生党模式、仅大号、冷却时间、逐用户幂等、模板授权状态和额度余额。

通过校验后，Server 原子扣减额度，创建 notify_log 并调用微信订阅消息接口。同步错误码决定是否重试或返还额度，微信异步回执负责补充最终状态。用户点击通知进入的小程序页面必须是已发布的直播详情页。

---

## 5. 数据模型与数据责任

### 5.1 核心集合

| 集合 | 作用 | 关键约束 |
|---|---|---|
| users | 用户账号、设置、授权状态 | openid 唯一；状态包含 active、banned、deleting |
| anchors | 全局主播池和探测状态 | platform + platformUid 唯一 |
| subscriptions | 用户关注主播和个人配置 | userId + anchorId 唯一；含 enabled、categoryIds、remark、sortOrder |
| user_anchor_categories | 用户私有分类 | userId + name 唯一；软删除 |
| recommendation_sets | 主播广场公共推荐专题 | 后台维护上下架、排序和推荐说明 |
| quota_ledger | 额度追加账本 | idempotencyKey 唯一；只追加不修改 |
| user_quota | 额度余额快照 | userId 唯一；原子扣减 |
| live_sessions | 一场开播会话 | sessionKey 唯一；含探测来源和延迟 |
| notify_logs | 单用户单次推送生命周期 | userId + sessionId + templateId 唯一 |
| platform_configs | Provider 和限流配置 | 按 platform/provider 唯一 |
| admins | 后台账号和角色 | 账号唯一、角色可多选 |
| audit_logs | 管理员操作审计 | 记录操作人、对象、前后摘要、原因和时间 |
| metrics_daily | 聚合指标 | 日期 + 指标名称 + 维度唯一 |

### 5.2 关键索引

| 查询场景 | 必须建立的索引 |
|---|---|
| 扫描到期主播 | anchors.status + pollTier + lastPolledAt |
| 按主播查询订阅者 | subscriptions.anchorId + enabled |
| 查询用户监听列表 | subscriptions.userId + enabled + sortOrder |
| 查询用户分类 | user_anchor_categories.userId + sortOrder |
| 额度幂等 | quota_ledger.idempotencyKey unique |
| 开播会话幂等 | live_sessions.sessionKey unique |
| 推送幂等 | notify_logs.userId + sessionId + templateId unique |
| 后台用户检索 | users.status + lastActiveAt、users.openid、users.nickname |
| 推送日志检索 | notify_logs.userId + createdAt、notify_logs.state + createdAt |

### 5.3 数据保存原则

用户业务数据需要保存，以支持跨设备同步、推送排障和账号管理；无关敏感信息不采集。openid 在数据库中作为内部识别字段，后台默认脱敏展示。session_key、抖音 Cookie、签名凭证不能进入普通业务 API 和日志。

用户取消监听时建议软删除订阅关系，保留必要的历史推送关联。用户删除分类时只删除分类关系。用户注销时删除或匿名化昵称、头像和 openid 等身份信息，并按配置清理推送明细和调试日志。

---

## 6. 平台 Provider 需求

### 6.1 统一能力

每个 Provider 必须支持健康检查、主播解析、状态查询和结果归一化四类能力，并返回平台、稳定 ID、昵称、头像、直播间链接、状态、标题、封面、开播时间、在线人数、Provider 名称、抓取时间和置信度。

### 6.2 B 站 Provider

优先使用支持批量查询的直播状态接口。Provider 需要处理 mid、直播间短号和长号的转换。`live_status=1` 归一化为直播中，0 和轮播状态归一化为非直播或特殊状态，不能把轮播当成主播真实开播。

### 6.3 抖音 Provider

抖音 Provider 采用链路优先级和熔断策略。第一层为签名直连，第二层为 Playwright 浏览器探测，第三层为第三方付费 API。每层都有超时、失败计数、重试和熔断时间。全部失败时，Server 不生成开播事件，只记录 Provider 故障和告警，避免把技术异常误判为下播或开播。

抖音 Provider 需要将平台状态字段统一转换，避免上层业务直接处理平台特有语义。凭证池和签名材料只能由 Worker/Crawler 访问，Admin 只能查看健康状态和必要的配置摘要，不能在普通页面展示完整凭证。

### 6.4 Provider 扩展验收

新增平台时，必须只新增平台配置、Provider 实现、解析适配和状态映射；不应修改订阅、额度、推送、分类和 Client API 的业务结构。新增 Provider 至少通过主播解析、未开播、开播、异常、恢复、重复探测和限流测试。

---

## 7. 队列与后台任务

| 队列 | 触发方式 | 主要职责 | 失败策略 |
|---|---|---|---|
| poll-schedule | 每 5 秒周期任务 | 扫描到期主播并分组投递 | 分布式锁；失败告警 |
| poll-execute | 调度投递 | 批量调用 Provider 并更新快照 | 超时重试；Provider 降级 |
| poll-confirm | 延迟任务 | 低置信度开播二次确认 | 最多重试指定次数 |
| notify-dispatch | 确认开播后 | 展开订阅者并创建发送任务 | 幂等，不重复展开 |
| notify-send | 分发投递 | 执行校验链并调用微信发送 | 可重试错误指数退避 |
| anchor-refresh | 每 6 小时 | 刷新主播公开资料和有效性 | 连续失败后暂停 |
| quota-reconcile | 每日 | 账本与余额快照对账 | 记录差异并告警 |
| metrics-rollup | 每 5 分钟 | 聚合探测、推送、用户和推荐指标 | 可重复执行 |
| data-cleanup | 每日或每周 | 清理过期日志、软删除数据和调试响应 | 分批执行，避免锁表 |

所有任务需要有 traceId、jobId、业务幂等键、开始时间、结束时间、重试次数和最终状态。任务不能把完整用户隐私、session_key、Cookie 或签名参数写进日志。

---

## 8. Client API 规划

| 方法 | API | 主要职责 | 关键校验 |
|---|---|---|---|
| POST | `/api/v1/auth/login` | 微信登录 | code 有效性、账号状态 |
| GET | `/api/v1/user/profile` | 返回用户资料、设置、额度摘要 | JWT、脱敏字段 |
| PUT | `/api/v1/user/settings` | 更新个人设置 | 时间格式、枚举、用户归属 |
| GET | `/api/v1/anchors/search` | 搜索主播 | 平台、关键词长度、频率限制 |
| POST | `/api/v1/anchors/resolve` | 解析链接/分享文案 | 平台格式、请求限流 |
| GET | `/api/v1/anchors/pool` | 获取推荐专题和主播 | 上下架、排序、分页 |
| GET | `/api/v1/anchors/:id` | 主播详情 | 主播存在性和状态 |
| GET | `/api/v1/subscriptions` | 获取当前用户监听 | 只能查询本人 |
| POST | `/api/v1/subscriptions` | 添加监听 | 主播存在、数量上限、分类归属、幂等 |
| PATCH | `/api/v1/subscriptions/:id` | 修改开关、备注、排序、分类 | 订阅属于当前用户 |
| DELETE | `/api/v1/subscriptions/:id` | 取消监听 | 软删除、幂等 |
| POST | `/api/v1/subscriptions/batch` | 批量开关和归类 | 数量上限、分类归属 |
| GET | `/api/v1/categories` | 获取个人分类 | 只能查询本人 |
| POST | `/api/v1/categories` | 创建分类 | 名称、重名、数量上限 |
| PATCH | `/api/v1/categories/:id` | 修改分类 | 分类归属、版本号 |
| DELETE | `/api/v1/categories/:id` | 删除分类 | 只清理关系 |
| POST | `/api/v1/categories/:id/subscriptions` | 批量归类 | 订阅归属、幂等 |
| GET | `/api/v1/quota` | 查询额度和流水摘要 | 只返回本人数据 |
| POST | `/api/v1/quota/refresh` | 授权后刷新余额 | 只查询，不发放 |
| GET | `/api/v1/notify/logs` | 查询推送记录 | 只返回本人记录 |
| POST | `/api/v1/notify/test` | 测试推送 | 频率限制、预留额度策略 |
| GET | `/api/v1/diagnose/auth` | 检查授权状态 | 只返回可理解状态 |
| GET | `/api/v1/live/sessions` | 历史开播记录 | 用户数据权限、分页 |
| GET | `/api/v1/help/faq` | FAQ | 发布状态、版本 |
| GET | `/api/v1/config/app` | 客户端配置 | 不返回密钥和内部配置 |

统一响应至少包含业务状态、提示信息、数据、traceId。服务端错误不能直接将堆栈、外部平台原始响应或敏感字段返回给 Client。

---

## 9. Admin API 规划

Admin API 使用独立前缀、独立 JWT 或独立会话、RBAC 和操作审计。所有列表接口都要分页、过滤、排序和导出权限控制；所有写操作都需要记录原因和操作结果。

| 模块 | 核心接口方向 | 操作权限 |
|---|---|---|
| Admin 认证 | 登录、刷新令牌、退出、当前管理员信息 | Admin 账号权限 |
| 用户管理 | 用户列表、用户详情、关注主播、个人分类、额度、推送记录 | 用户支持只读；高风险操作需更高角色 |
| 用户状态 | 封禁、解封、注销处理 | 超级管理员或用户支持授权 |
| 额度管理 | 查询、人工调整、流水审计 | 超级管理员；必须填写原因 |
| 主播池 | 主播新增、编辑、停用、标签、探测层级 | 内容运营或超级管理员 |
| 推荐管理 | 推荐专题、推荐主播、推荐理由、排序、上下架 | 内容运营 |
| Provider 运维 | 健康状态、成功率、耗时、熔断、降级开关 | 运维或超级管理员 |
| 推送审计 | 推送日志检索、错误码、补发、测试发送 | 用户支持可查看；补发需授权 |
| 系统配置 | 轮询间隔、限流、额度上限、模板配置 | 超级管理员 |
| 监控指标 | 队列积压、探测延迟、失败率、推送成功率 | 运维、超级管理员 |
| 审计日志 | 管理员操作查询 | 审计或超级管理员 |

Admin 不直接修改用户 DIY 分类和用户关注关系。第一版保留用户数据只读查看能力，以便客服排查；如果未来增加代操作，需要单独的临时授权、二次确认、前后差异和用户通知机制。

---

## 10. 权限与安全

### 10.1 Client 用户权限

用户只能读取和修改自己的用户资料、设置、分类、订阅、额度展示和推送记录。主播和推荐内容属于公共数据，但用户操作推荐主播形成的订阅关系属于个人数据。任何涉及 userId 的请求都必须从 JWT 解析，不能信任 Client 提交的 userId。

### 10.2 Admin 权限

后台采用角色权限控制。超级管理员管理系统和高风险业务；用户支持查看用户详情并处理基础支持动作；内容运营维护公共主播和推荐；运维审计处理服务指标和审计。所有角色默认拒绝未配置权限。

### 10.3 敏感数据保护

openid 在日志和列表中脱敏；session_key、平台 Cookie、签名凭证进入加密配置或密钥管理，不进入普通 MongoDB 业务集合；外部平台原始响应应脱敏后短期保留。API 需要 HTTPS、请求限流、JWT 过期、重复提交防护和关键操作二次确认。

### 10.4 数据删除

用户可以发起注销或数据删除请求。Server 需要处理删除任务，清理或匿名化用户身份、分类、订阅、额度和推送数据；保留的数据必须是无法识别个人的统计或依法需要保留的审计数据。删除过程要可查询、可重试、可审计。

---

## 11. 监控、告警和日志

### 11.1 必须监控的指标

| 指标 | 说明 | 告警方向 |
|---|---|---|
| API 响应时间 | 区分 Client API 和 Admin API | P95 持续升高 |
| API 错误率 | 按接口和业务错误码统计 | 超过阈值 |
| Provider 成功率 | 按平台和 Provider 统计 | 连续下降或熔断 |
| 探测延迟 | 从平台开播到 Server 确认的延迟 | P95 超标 |
| 开播事件数 | 每小时/每日开播会话数 | 异常突增或归零 |
| 推送成功率 | 同步成功与异步回执 | 下降时告警 |
| 额度异常 | 账本和快照差异 | 立即告警 |
| 队列积压 | 各队列等待和失败任务 | 持续积压 |
| MongoDB/Redis | 连接、内存、磁盘和慢查询 | 资源临界 |

### 11.2 日志要求

日志需要包含时间、服务、模块、traceId、jobId、userId 脱敏标识、anchorId、platform、错误分类和耗时。禁止记录 openid 明文、session_key、Cookie、签名完整参数、JWT 原文和完整微信敏感返回。

---

## 12. 非功能需求

| 项目 | V1 要求 |
|---|---|
| 可用性 | API 和 Worker 异常重启后可恢复；任务不因进程重启丢失 |
| 幂等性 | 关键业务重复调用不会重复创建、重复扣额度或重复推送 |
| 扩展性 | 新平台通过 Provider 接入，不修改核心推送流程 |
| 性能 | 普通 API 目标 P95 小于 500ms，不包含外部探测等待 |
| 批量能力 | B 站支持批量探测；订阅者推送支持分批展开 |
| 数据安全 | 敏感字段脱敏、权限隔离、关键操作审计 |
| 可运维 | 有健康检查、队列面板、错误告警和 Provider 状态 |
| 可恢复 | MongoDB 定期备份；Redis 队列持久化；支持故障恢复演练 |
| 限流 | Client、Admin、外部平台 Provider 分层限流 |

---

## 13. 版本范围

### V1 必须完成

认证与 JWT、用户与设置、主播池、B 站 Provider、抖音 Provider 链路预留、订阅关系、用户 DIY 分类、微信订阅回调、额度账本、开播状态机、B 站开播提醒、推送日志、Admin 用户列表、主播池管理、推送审计、基础监控和操作审计。

### V1.1 建议完成

抖音签名直连和 Playwright 兜底、主播广场推荐、Provider 熔断、批量归类、管理员用户详情、额度对账、数据清理、队列可视化和告警。

### 后续版本

第三方抖音接口兜底、更多平台、团队版、Webhook、智能开播时段、付费会员、推荐合作数据和更细的运营分析。

---

## 14. Server 端验收标准

服务端验收必须覆盖以下闭环：用户可以登录；添加同一主播多次不会重复；用户分类只能访问和修改本人数据；删除分类不删除监听；后台可以查看用户、关注主播、分类和推送记录；微信订阅回调能够幂等增加额度；Client 无法伪造额度；B 站批量状态可以正常归一化；抖音 Provider 失败时可以降级或熔断；未开播转直播中只生成一条会话；同一会话不会重复推送；额度不足、免打扰、拒收和关闭订阅时不消耗额度；推送失败按错误类型重试或返还；管理员额度调整和补发操作都有审计记录。

压力测试至少模拟 1000 个主播、多个用户订阅、连续探测、队列积压和 Worker 重启。故障测试至少覆盖 MongoDB 短暂不可用、Redis 重启、微信 access_token 失效、Provider 超时、重复微信回调和重复 Client 请求。

---

## 15. 参考资料

本 PRD 依据用户提供的《主播开播监控微信小程序：项目规划方案》拆分而来。关键外部资料包括：

[1] [微信小程序订阅消息官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message-overview.html)

[2] [B 站直播接口资料](https://github.com/pskdje/bilibili-API-collect/blob/main/docs/live/info.md)

[3] [抖音直播状态获取参考实现](https://github.com/saermart/DouyinLiveWebFetcher/blob/main/liveMan.py)

[4] [抖音直播状态第三方接口资料](https://docs.tikhub.io/327216949e0)

[5] [抖音直播开放平台资料](https://developer.open-douyin.com/docs/resource/zh-CN/dop/ability/douyin-live-sdk/douyin-live-sdk/interface-and-function)

[6] [微信小程序订阅消息开发指南](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html)
