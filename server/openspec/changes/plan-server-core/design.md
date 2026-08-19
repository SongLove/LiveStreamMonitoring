## Context

依据 `proposal.md` 与 Server PRD / 项目规划：NestJS 单体双入口（API + Worker）、MongoDB + Redis + BullMQ、微信一次性订阅额度、B 站官方批量探测、抖音可降级探测。仓库尚无服务端实现代码，本设计直接约束首版落地方式。关键约束：额度只认微信回调；开播判定不走 LLM；能买则买、能接生态则不自研。

## Goals / Non-Goals

**Goals:**
- 给出可直接开工的模块边界、数据权威、队列拓扑与第三方选型。
- 固化抖音「第三方优先」与降级编排，降低自研签名排期风险。
- 明确 AI/Agent 实现边界：改什么、调什么外部能力、禁做什么。
- 保证 API 与 Worker 共享领域模型但不混职责。

**Non-Goals:**
- 不规定 Admin/小程序 UI 像素级交互。
- 不定 K8s/微服务拆分；V1 以 Docker Compose 单机为主。
- 不在本设计展开每张表全字段 DDL（索引与集合级约束见 PRD；实现时按 Schema 落地）。
- 不将抖音开放平台事件回调作为 V1 依赖（企业资质后续项）。

## Decisions

### D1. 单体双入口，而非拆微服务
- **选择**：同一 NestJS 代码库，`api` / `worker`（可选 `crawler`）不同 bootstrap。
- **理由**：万级用户、千级主播，运维成本优先；共享 Schema 避免双写漂移。
- **备选**：按域拆服务 — 过早，拒绝。

### D2. 第三方与生态包清单（强制优先）

| 能力 | 采用 | 禁止自研原因 |
|---|---|---|
| HTTP API / DI / 校验 | NestJS + class-validator | 框架已覆盖 |
| Mongo | `@nestjs/mongoose` | 官方集成 |
| 队列 | BullMQ + `@nestjs/bullmq` | 持久化、重试、延迟任务现成 |
| 队列面板 | Bull Board 挂 Admin 内嵌 | 不自研监控台 |
| 限流 | `@nestjs/throttler` + Redis 令牌桶（平台级） | 标准能力 |
| 配置 | `@nestjs/config` + 环境变量/密钥文件 | 十二要素 |
| 文档 | Swagger | 联调成本 |
| 健康检查 | Terminus | 探针标准 |
| 日志 | pino / nestjs-pino | 结构化与脱敏中间件 |
| 微信 API | 官方 HTTPS 接口 + 自封装薄 client | 不引入过重 SDK 也可，但勿自造协议 |
| 节假日（学生党） | 第三方节假日日历数据（可缓存） | 不维护法定假日表 |
| 头像转存 | 对象存储 SDK（COS/OSS/S3 兼容） | 防盗链 |
| 抖音状态（默认） | TikHub 等批量状态 API | 风控与签名维护成本 |
| 抖音兜底 | Playwright 持久上下文 | 仅高价值/熔断时 |
| 抖音可选增强 | 签名直连（参考开源实现） | 非 V1 阻塞项 |
| B 站 | 公开批量直播状态接口 | 零成本权威 |

### D3. 抖音链路优先级（业务设定）
默认顺序：**第三方 API →（可选）签名直连 → Playwright**。  
可通过 `platform_configs` 热更新调整优先级与熔断开关。全部失败只告警，不改状态机为开播/下播。

### D4. 额度与微信 access_token
- 发放：仅微信订阅事件回调；单对象/数组归一化。
- 账本：`quota_ledger` 追加 + `user_quota` 快照；扣减条件更新。
- `access_token`：Redis 集中缓存 + 分布式锁串行刷新；API/Worker 只读缓存，禁止多实例各自刷新互踢。

### D5. 开播判定与推送解耦
`poll-execute` 写 Redis 快照 → 状态机 →（必要时）`poll-confirm` → 唯一 `live_sessions` → `notify-dispatch` → `notify-send` 校验链。  
推送决策纯规则引擎，**运行时禁止调用 LLM**。

### D6. AI / Agent 调用边界（实现期）

| 类别 | 允许 | 禁止 |
|---|---|---|
| 代码范围 | `server/` 内按模块实现 specs/tasks | 改 Client/Admin 业务除非任务明确 |
| 外部调用（产品运行时） | 微信、B 站、抖音 Provider、节假日 API、对象存储 | 用 LLM 判定开播/发额度/过校验链 |
| 外部调用（研发辅助） | 查官方文档、生成样板代码、补测试 | 把密钥写入仓库/日志；提交含 Cookie 的 fixture |
| 造轮子 | 薄适配层（Provider 接口、错误码映射） | 自研队列、权限框架、监控大盘、日历库 |
| 范围控制 | 严格按 tasks 勾选推进 | 擅自加弹幕/录播/手机号/长期订阅 |

**AI 可调用工具边界建议**：读 PRD/OpenSpec、改 server 源码、跑测试与 docker compose；不得在未确认时替换 BullMQ、不得把第三方响应明文提交进 git。

### D7. 模块映射

```
auth / user / anchor / category / subscription / quota
live / notify / wechat / crawler(providers) / scheduler
admin / metrics(health)
```

API 加载：auth…admin 同步接口 + wechat 回调。  
Worker 加载：scheduler 消费者 + crawler + notify + quota reconcile 等。

### D8. 版本切片
- **V1**：认证、用户设置、主播池、订阅、分类、额度回调、B 站探测+开播提醒、推送日志、Admin 基础（用户列表/推送审计/额度调整）、抖音第三方 Provider 可运行。
- **V1.1**：签名/Playwright 完善、推荐广场、对账清理、熔断面板深化。
- **后续**：开放平台事件、更多平台、会员等。

## Risks / Trade-offs

- [抖音第三方成本/可用性] → 分层轮询降频 + 批量凑单 + 熔断切 Playwright；成本告警。
- [第三方 API 字段变更] → 归一化隔离在 Provider；契约测试。
- [误报开播] → 二次确认 + 轮播语义 + 最短重播间隔。
- [额度纠纷] → 只认回调 + 账本幂等 + 错误码返还表。
- [access_token 互踢] → 单锁刷新（见 D4）。
- [AI 过度实现] → tasks 分阶段 + integration-boundary 验收。
- [单机瓶颈] → 先垂直扩容 Worker 并发与 Redis；后再谈拆分。

## Migration Plan

1. 空仓库脚手架：Docker Compose（api/worker/mongo/redis/nginx）+ Nest 双入口。
2. 先通微信：登录 → 回调发额度 → 管理端/工具手动下发一条通知。
3. 再通 B 站：解析 → 订阅 → 调度 → 会话 → 推送。
4. 并行接抖音第三方 Provider；签名/Playwright 不阻塞主路径。
5. 回滚：镜像版本回退；队列任务幂等可重放；Mongo 定期备份恢复。

## Open Questions

- 微信公共模板最终选用哪一套字段（需实号到模板库确认后映射到 notify 渲染）。
- 对象存储具体云厂商（实现前按环境变量抽象即可）。
- 抖音第三方供应商最终合同选型（接口保持 Provider 可替换）。
