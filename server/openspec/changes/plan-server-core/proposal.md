## Why

主播开播监控系统需要 Server 作为唯一业务权威层，才能把「登录 → 加主播 → 攒额度 → 探测开播 → 精准推送」闭环跑通，并避免 Client 伪造额度、重复探测、误报开播等致命问题。现有 PRD 与技术规划已定性产品边界，但缺少可落地的服务端能力规格、业务规则与「自研 vs 第三方 / AI 调用」边界，直接开工会导致重复造轮子与边界漂移。

## What Changes

- 确立 Server（NestJS API + Worker）为数据、权限、额度、开播状态与推送的唯一权威层；Client/Admin 不得直连 MongoDB，不得伪造额度或开播状态。
- 规划并规格化核心业务能力：认证、用户设置、全局主播池、订阅关系、用户 DIY 分类、额度账本、开播状态机、推送校验链、平台 Provider、队列调度、Admin RBAC 与审计。
- 明确微信一次性订阅额度模型：只认微信订阅回调发放，账本追加 + 余额快照双写，推送前原子扣减。
- 明确平台探测：B 站官方批量接口优先；抖音走「第三方优先 / 签名直连可选 / Playwright 兜底」可降级链路，失败熔断不误判开播。
- 明确集成与 AI 调用边界：能用成熟第三方与 Nest 生态包则不自研；AI/Agent 只允许改边界内模块，禁止自造队列框架、限流框架、监控大盘与抖音签名核心算法。
- V1 范围对齐 PRD：打通 B 站开播提醒闭环；抖音 Provider 链路可运行或可降级；推荐广场与部分运维能力按 V1.1 标注。

## Capabilities

### New Capabilities

- `auth-identity`: 微信小程序登录、自有 JWT、Admin 独立认证、账号禁用/注销状态约束
- `user-account`: 用户资料、推送相关设置（总开关/免打扰/学生党/仅大号）、跨设备同步
- `anchor-pool`: 全局主播去重池、链接/关键词解析、搜索入库、资料刷新与 pollTier
- `user-category`: 用户私有 DIY 分类 CRUD、与订阅多对多归属；删除分类不取消监听
- `subscription`: 用户关注关系、单主播开关、批量操作、数量上限与幂等
- `quota-ledger`: 微信回调权威发放、账本幂等、余额快照原子扣减/返还/上限、对账
- `live-session`: Redis 快照 + 状态机防抖、开播会话唯一键、最短重播间隔
- `notify-dispatch`: 推送十一项校验链、模板渲染、微信下发、错误码策略、推送日志
- `platform-provider`: 统一 Provider 接口、B 站批量探测、抖音降级链路、限流熔断
- `worker-scheduler`: BullMQ 队列、分层轮询、周期任务、幂等与可观测任务元数据
- `admin-rbac`: Admin API、角色权限、用户/主播/推送审计、额度调整与操作审计
- `integration-boundary`: 第三方优先清单、禁止自研清单、AI/Agent 可调用与禁入边界

### Modified Capabilities

- （无；`openspec/specs/` 尚无既有能力规格）

## Impact

- **代码/结构**：新建 `server/` NestJS 单体双入口（api / worker），共享领域模块与 Schema；可选独立 crawler 进程承载 Playwright/Python Provider。
- **API**：Client `/api/v1/*`、Admin 独立前缀与 JWT、微信服务器回调入口。
- **依赖（优先第三方）**：NestJS 官方模块（Config/Mongoose/BullMQ/Throttler/Swagger/Terminus）、ioredis、Bull Board、Playwright（兜底）、节假日日历第三方数据源、抖音状态第三方 API（TikHub 等）、对象存储（头像转存）。
- **外部系统**：微信登录/订阅消息/事件推送、B 站公开直播接口、抖音探测链路、Nginx HTTPS。
- **非影响**：Client 页面渲染、Admin 前端交互细节、直播内容抓取/弹幕/录播（V1 非目标）。
