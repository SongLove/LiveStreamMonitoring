## Why

主播开播监控小程序 Client 端是用户完成「添加主播 → 授权提醒 → 查看状态 → 收到通知 → 进入直播间」闭环的唯一交互入口。PRD 与技术规划已明确 Client 只负责展示与引导、Server 为权威层，但 `client/` 目录尚无脚手架与可落地规格，缺少页面能力划分、微信订阅授权流程约束，以及「自研 vs 第三方 / AI 调用」边界——直接开工会导致前端伪造额度、本地推断开播状态、重复造轮子等问题。

## What Changes

- 确立 Client（uni-app 微信小程序）职责边界：展示 Server 权威数据、用户输入与交互校验、订阅消息授权引导、路由与本地体验；不探测开播、不发放额度、不直连抖音/B 站、不保存 session_key 或平台凭证。
- 规划并规格化核心页面与业务能力：五 Tab 信息架构、监控首页、添加主播、主播广场、详情落地、DIY 分类、设置、帮助诊断、推送记录、额度授权引导、直播回放。
- 明确微信一次性订阅交互模型：仅用户主动点击触发 `wx.requestSubscribeMessage`；授权后只调 `/quota/refresh` 刷新余额，不自增次数。
- 明确第三方优先选型：unibest 脚手架、Wot UI v2、Pinia 持久化、unibest 内置请求封装；埋点优先微信官方/we 分析或成熟 SDK，不自研 UI 库与 HTTP 框架。
- 明确 AI/Agent 调用边界：实现期只改 `client/` 内 specs/tasks 范围；运行时禁止 LLM 判定开播/额度；研发辅助可查文档与生成样板，不得把密钥写入仓库。
- V1 对齐 PRD 必做项；主播广场完整推荐、批量归类、回放筛选、动态配置等标注 V1.1。

## Capabilities

### New Capabilities

- `integration-boundary`: 第三方优先清单、禁止自研清单、AI/Agent 可调用与禁入边界
- `app-shell`: unibest 工程骨架、五 Tab 路由、远程配置、全局布局与错误边界
- `auth-session`: 微信登录、JWT 存储与过期、登录拦截、账号状态提示
- `api-client`: 统一请求封装、鉴权头、traceId、错误码映射与重试策略
- `monitor-home`: 监控首页、分类导航、监听列表、额度卡片、权限异常横幅
- `anchor-discovery`: 添加主播（搜索/解析）与主播广场推荐
- `anchor-detail`: 主播详情、推送卡片落地、跳转平台直播间
- `user-category-ui`: 用户 DIY 分类 CRUD、排序、批量归类、系统视图
- `subscription-ui`: 订阅列表操作、单主播开关、批量开关、取消监听
- `quota-subscribe`: 一次性订阅授权引导、余额展示、增加次数页
- `live-replay-ui`: 历史开播会话列表与筛选
- `user-settings-ui`: 推送设置、免打扰、学生党/仅大号模式
- `help-diagnose`: 帮助中心、四项自助诊断、FAQ、本地/服务端缓存清理
- `notify-records-ui`: 推送记录列表与可理解的状态说明
- `analytics-events`: 非敏感行为埋点与核心产品指标上报

### Modified Capabilities

- （无；`client/openspec/specs/` 尚无既有能力规格）

## Impact

- **代码/结构**：在 `client/` 基于 unibest 初始化 uni-app 微信小程序工程；约定式路由 + Pinia stores + composables。
- **API 依赖**：消费 Server `/api/v1/*` 全套 Client 接口；不直连 MongoDB/Redis。
- **依赖（优先第三方）**：create-unibest / unibest 模板、@wot-ui/ui、pinia + pinia-plugin-persistedstate、@dcloudio/uni-app 微信 API、可选 we 分析/友盟等埋点 SDK。
- **外部系统**：微信登录、订阅消息弹窗、打开外部链接/复制直播间链接；不调用抖音/B 站探测接口。
- **非影响**：Server 探测/推送/额度账本、Admin 运营配置（Client 只消费接口与 `/config/app` 下发）。
