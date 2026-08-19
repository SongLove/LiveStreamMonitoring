## Context

依据 `proposal.md`、Client PRD 与项目技术规划：uni-app + Vue3 + TS，unibest 脚手架 + Wot UI v2，Server 为开播状态/额度/分类/推送的唯一权威。仓库 `client/` 尚无代码，本设计约束首版落地方式。关键约束：不在 Client 推断开播或自增额度；订阅弹窗仅用户点击触发；能复用 unibest/微信官方能力则不自研。

## Goals / Non-Goals

**Goals:**
- 给出可直接开工的页面架构、状态分层、第三方选型与 Server 接口映射。
- 固化微信一次性订阅交互：授权 → 等回调 → refresh 余额，禁止前端发放逻辑。
- 明确 AI/Agent 实现边界：改什么、用什么 MCP/技能辅助、禁做什么。
- 保证与 Server `plan-server-core` 接口契约一致，分类/推荐/额度语义不漂移。

**Non-Goals:**
- 不规定 Admin 后台或 Server Worker 实现细节（见 server/openspec）。
- 不在 Client 实现抖音/B 站链接解析规则（全部 POST `/anchors/resolve`）。
- V1 不做付费会员页、长期订阅、智能开播预测、第三方日历联动。
- 不做 H5/App 多端适配优先（以微信小程序为主，unibest 保留扩展位即可）。

## Decisions

### D1. 脚手架：unibest + Wot UI v2，而非从零搭 uni-app
- **选择**：`create-unibest` 初始化，UI 选 `@wot-ui/ui`（Wot UI v2）；保留 unibest 内置请求封装、路由拦截、layout、UnoCSS。
- **理由**：技术规划已定性；unibest 覆盖登录拦截与请求层，避免重复造轮子。
- **备选**：官方 `uni-preset-vue` 裸脚手架 — 需自补路由/请求/规范，拒绝。

### D2. 第三方与生态包清单（强制优先）

| 能力 | 采用 | 禁止自研原因 |
|---|---|---|
| 工程脚手架 | unibest（create-unibest） | 约定式路由、拦截器现成 |
| UI 组件 | @wot-ui/ui（Wot UI v2） | 小程序适配完整 |
| 状态管理 | Pinia + pinia-plugin-persistedstate | 官方推荐组合 |
| HTTP | unibest 内置请求封装（基于 uni.request） | 勿再包一层 axios 等价物 |
| 路由 | vite-plugin-uni-pages 约定式路由 | unibest 内置 |
| 样式 | UnoCSS（unibest 默认）+ Wot Design Token | 勿自研组件库 |
| 微信登录 | uni.login + Server `/auth/login` | 标准链路 |
| 订阅消息 | wx.requestSubscribeMessage（用户点击） | 微信强制交互 |
| 埋点 | 微信 we 分析 / 友盟+ 等成熟 SDK（选一） | 不自研全链路埋点平台 |
| 时间/格式化 | dayjs | 轻量标准库 |
| 下拉刷新/列表 | Wot UI + uni 原生 pull-down-refresh | 勿自研虚拟列表（V1） |
| 远程配置 | Server `GET /config/app` | 运营开关不发版 |

### D3. Client 业务权威边界（与 Server 对齐）

| 数据/决策 | 权威来源 | Client 行为 |
|---|---|---|
| 主播是否开播 | Server `/subscriptions`、详情接口 | 只展示 `liveStatus` + `statusUpdatedAt` |
| 推送额度余额 | Server `/user/profile`、`/quota` | 授权后调 `/quota/refresh`，禁止本地 +1 |
| 分类与订阅关系 | Server categories/subscriptions API | 乐观 UI 可选，以接口响应为准 |
| 推荐专题内容 | Server `/anchors/pool` | 只读展示，关注后仍让用户选私有分类 |
| 订阅模板授权状态 | Server profile + `/diagnose/auth` | 横幅与修复引导 |
| 链接/分享文案解析 | Server `/anchors/resolve` | Client 只提交原文 |

### D4. 信息架构与路由

五 Tab（与技术规划一致）：

```
监控(home) | 主播广场(square) | 直播回放(replay) | 设置(settings) | 帮助(help)
```

二级页（subPackages 或同级 stack）：

- `/pages/anchor/add` 添加主播
- `/pages/anchor/detail` 详情（含推送落地 query: sessionId）
- `/pages/category/manage` 分类管理
- `/pages/notify/logs` 推送记录
- `/pages/quota/guide` 增加授权次数

Tab 与 PRD 6.1–6.10 一一对应；首页不自动弹订阅窗。

### D5. 状态分层

```
Pinia stores:
  authStore      — token、userId、登录态
  profileStore   — 用户资料、额度摘要、授权状态镜像（来自 Server）
  subscriptionStore — 当前分类下监听列表缓存
  categoryStore  — DIY 分类列表
  appConfigStore — /config/app 远程开关与公告

Composables:
  useSubscribeMessage — 封装授权点击、模板 ID、结果 toast
  useQuotaRefresh     — 授权后 refresh + profile 刷新
  usePullRefresh      — 列表页统一下拉刷新
```

本地持久化仅：token、最近搜索关键词（非敏感）、UI 偏好；**不**持久化额度余额作为权威（可缓存展示但须标 stale）。

### D6. 微信订阅授权交互（产品设定）

1. **触发时机**：首次添加主播成功后的引导页/按钮；首页额度卡片「增加次数」；帮助中心修复流程——**均须用户点击**。
2. **禁止**：`onLaunch`/`onShow` 自动 `requestSubscribeMessage`。
3. **流程**：点击 → `requestSubscribeMessage({ tmplIds })` → 无论 accept/reject 都调 `POST /quota/refresh` → 刷新 profile/quota 展示。
4. **文案**：不得承诺「绝对送达」；说明一次性订阅模型与 200 上限（以 Server 配置为准）。
5. **模板 ID**：从 `/config/app` 或环境变量读取，禁止硬编码多环境。

### D7. AI / Agent / MCP 调用边界（实现期）

| 类别 | 允许 | 禁止 |
|---|---|---|
| 代码范围 | `client/` 内按 specs/tasks 实现 | 改 Server/Admin 除非任务明确要求联调契约 |
| 运行时产品逻辑 | 展示 Server 字段、微信官方 API | LLM 判定开播；本地解析抖音/B 站；前端 +额度 |
| 研发辅助（AI/MCP） | 读 PRD/OpenSpec/Figma；查 unibest/wot-ui/微信文档；生成页面样板 | 把 JWT/模板密钥提交 git；绕过 specs 加功能 |
| 第三方/MCP | Figma MCP（若有设计稿）；微信官方文档 | 自建 MCP 替代 Server 业务 API |
| 造轮子 | 薄封装 composable（subscribe、refresh） | 自研 UI 库、请求框架、埋点平台、链接解析器 |

**推荐 MCP/Skill 使用场景：**
- `openspec-apply-change`：按 tasks 逐项实现
- Figma `get_design_context`：有设计稿时还原页面（须适配 Wot UI）
- 微信订阅消息文档检索：确认模板字段与「不再询问」修复路径

### D8. 版本切片

- **V1（必做）**：登录、监控首页、添加主播（抖+B 站）、详情、DIY 分类、单主播/总开关、订阅引导与额度展示、推送记录、设置、帮助中心（含测试推送与诊断）、基础埋点、异常态。
- **V1.1（建议）**：主播广场完整专题、批量归类/批量开关、回放筛选、更多 FAQ、`/config/app` 公告与功能开关、用户数据导出入口。
- **后续**：智能预测、日历联动、付费会员（需资质另开 change）。

## Risks / Trade-offs

- [用户误以为状态实时] → 列表展示 `statusUpdatedAt` +「数据可能延迟」 copy。
- [订阅「不再询问」静默失败] → `/diagnose/auth` 驱动横幅 + 帮助中心图文修复。
- [unibest 版本漂移] → 锁定 create-unibest 版本号；pnpm lockfile 入库。
- [Wot UI v1/v2 混用] → 仅 @wot-ui/ui v2，禁止 wot-design-uni。
- [乐观更新与服务端冲突] → 写操作以 API 成功为准回滚 UI。
- [AI 过度生成页面] → 严格按 specs 验收；integration-boundary 守门。

## Migration Plan

1. `create-unibest` 初始化 `client/`，选 wot-ui-v2、pnpm。
2. 配置 `manifest.json` 微信小程序 appid、服务器域名白名单（联调期）。
3. 接入 `/auth/login` 与请求拦截；空壳五 Tab 可切换。
4. 按 tasks 顺序：首页 → 添加 → 分类 → 订阅授权 → 设置/帮助 → 详情落地 → 广场/回放（V1.1）。
5. 提审前：模板跳转 path 与正式版 env 对齐 Server notify 配置。

## Open Questions

- 埋点 SDK 最终选型（we 分析 vs 友盟+）——实现前在 design 备注环境变量即可。
- 是否有 Figma 设计稿需 Code Connect——有则另补 UI 任务，无则按 PRD + Wot UI 默认风格。
- 直播间跳转：复制链接 vs `web-view` vs 引导用户打开抖音/B 站 App——V1 建议复制链接 + 明确提示（小程序外链限制）。
