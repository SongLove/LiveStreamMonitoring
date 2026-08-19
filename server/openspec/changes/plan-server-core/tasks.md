## 1. 工程骨架与第三方底座

- [x] 1.1 初始化 NestJS 单体仓库结构（`api` / `worker` 双入口共享模块），Docker Compose 起 mongo、redis、api、worker
- [x] 1.2 接入官方生态：Config、Mongoose、BullMQ、Throttler、Swagger、Terminus、nestjs-pino（禁止自研等价框架）
- [x] 1.3 统一响应体（含 traceId）、全局校验管道、敏感字段脱敏日志中间件
- [x] 1.4 挂载 Bull Board（或同类）供队列可视化，仅内网/Admin 可访问

## 2. 认证与用户

- [x] 2.1 实现微信 code2Session 登录、users 唯一 openid、自有 JWT 签发与守卫（不返回 session_key）
- [x] 2.2 实现用户资料查询与 settings 更新（总开关/免打扰/学生党/仅大号），banned 状态约束写操作
- [x] 2.3 实现 Admin 独立登录与 JWT，与 Client 鉴权隔离

## 3. 主播池、分类、订阅

- [x] 3.1 落地 anchors Schema（platform+platformUid 唯一）、搜索/解析 API 骨架与限流
- [x] 3.2 落地 user_anchor_categories 与 subscriptions（含 categoryIds、软删除、幂等添加）
- [x] 3.3 实现分类 CRUD/批量归类：删除分类只清关系；未分类为虚拟视图
- [x] 3.4 实现订阅 CRUD/批量开关，关注数变化触发 pollTier 重算钩子

## 4. 微信、额度账本

- [x] 4.1 实现 access_token Redis 集中缓存 + 分布式锁串行刷新（多进程只读）
- [x] 4.2 接入订阅事件/拒收/下发回执回调；单对象与数组归一化；仅 accept 发放额度
- [x] 4.3 实现 quota_ledger + user_quota：幂等发放、条件原子扣减、上限、返还、`/quota/refresh` 只读
- [x] 4.4 实现手动/测试下发工具路径，验证「手机能收到第一条通知」里程碑

## 5. Provider 与探测（第三方优先）

- [x] 5.1 定义统一 Provider 接口与注册表（健康检查/解析/状态/归一化/置信度）
- [x] 5.2 实现 B 站 Provider：批量状态、短号转 mid、轮播≠开播
- [x] 5.3 实现抖音第三方状态 Provider（默认优先），平台级 Redis 令牌桶限流
- [x] 5.4 实现降级编排与熔断（第三方 → 可选签名 → Playwright）；全失败只告警不改状态
- [x] 5.5（可选 V1.1）Playwright 持久上下文兜底与签名直连适配器骨架

## 6. 调度、开播会话、推送

- [x] 6.1 实现 poll-schedule（5s + 分布式锁）按 pollTier 扫描并分组投递 poll-execute
- [x] 6.2 实现 Redis 状态快照 + 状态机 + poll-confirm 二次确认 + 最短重播间隔
- [x] 6.3 实现 live_sessions 唯一 sessionKey；确认后投递 notify-dispatch
- [x] 6.4 实现 notify-send 十一项校验链、模板字段截断映射、错误码重试/返还策略
- [x] 6.5 实现 notify_logs 幂等（userId+sessionId+templateId）与异步回执回填
- [x] 6.6 学生党模式接入第三方节假日日历数据源（本地缓存）

## 7. Admin、审计与运维任务

- [x] 7.1 Admin RBAC（超管/用户支持/内容运营/运维）默认拒绝；openid 脱敏
- [x] 7.2 用户列表/详情只读：关注、分类、额度、推送日志；禁止默认代改分类/订阅
- [x] 7.3 额度调整、封禁、补发写操作强制原因 + audit_logs
- [x] 7.4 Provider 健康摘要接口（不暴露完整凭证）；主播池基础管理
- [x] 7.5 周期任务：anchor-refresh、quota-reconcile、metrics-rollup、data-cleanup

## 8. 验收与边界守门

- [x] 8.1 按 PRD 验收闭环写集成测试：登录、幂等订阅、回调发额度、伪造额度失败、B 站开播只推一次、校验链跳过不扣额度
- [x] 8.2 故障演练清单：Redis 重启、token 失效、Provider 超时、重复回调、Worker 重启任务不丢
- [x] 8.3 核对 integration-boundary：依赖清单无自研队列/面板/日历；运行时开播/额度路径无 LLM 调用
- [x] 8.4 确认微信模板 ID 与字段映射、对象存储与抖音第三方密钥仅走环境变量（不进仓库）
