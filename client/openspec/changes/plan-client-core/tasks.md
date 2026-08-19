## 1. 工程骨架与第三方底座

- [x] 1.1 使用 uni-app (vue-preset-vite-ts) 初始化 `client/` + wot-design-uni + pnpm，配置 env
- [x] 1.2 约定式 pages.json 路由、统一请求封装、登录拦截
- [x] 1.3 接入 Pinia + pinia-plugin-persistedstate（token 持久化，额度不作权威持久化）
- [x] 1.4 实现五 Tab 路由壳与二级页分包（add、detail、category、logs、quota、square）
- [x] 1.5 接入 `GET /config/app` 与 appConfigStore（模板 ID、功能开关）

## 2. 认证与 API 层

- [x] 2.1 实现 uni.login → `POST /auth/login` → authStore 持久化 JWT（不存 session_key）
- [x] 2.2 扩展请求拦截：Authorization、401 登出、traceId 日志（脱敏）
- [x] 2.3 按 PRD 封装 `/api/v1` typed API 模块
- [x] 2.4 写操作按钮 loading/防重复提交（useSubmitGuard + 页面 loading）

## 3. 监控首页与订阅列表

- [x] 3.1 分类导航（全部/未分类/DIY）+ 数量 badge
- [x] 3.2 监听列表：liveState、平台 ID；开播样式区分
- [x] 3.3 额度卡片 + 权限异常横幅
- [x] 3.4 总开关映射 `PUT /user/settings`；下拉刷新
- [x] 3.5 空状态引导；**禁止** onShow 自动订阅弹窗

## 4. 添加主播与详情

- [x] 4.1 添加页：平台切换、resolve、错误态
- [x] 4.2 关注流程 POST subscriptions + 授权引导（按钮触发）
- [x] 4.3 详情页：开关、取消监听
- [x] 4.4 推送落地 sessionId + copyLink 进入直播间

## 5. DIY 分类

- [x] 5.1 分类管理 CRUD
- [x] 5.2 删除分类说明文案
- [x] 5.3 传媒监控 Tab 按分类筛选 + 单主播开关

## 6. 订阅授权与额度

- [x] 6.1 composable `useSubscribeMessage`
- [x] 6.2 授权后 `/quota/refresh` + profile 刷新
- [x] 6.3 增加次数引导页
- [x] 6.4 首次添加后引导授权（Modal 按钮触发）

## 7. 设置、帮助、推送记录

- [x] 7.1 设置页：总开关、免打扰、学生党、仅大号、清本地缓存
- [x] 7.2 帮助中心：四项诊断 + FAQ
- [x] 7.3 推送记录：状态/跳过原因中文映射

## 8. 直播回放与主播广场（V1.1）

- [x] 8.1 回放 Tab：`GET /live/sessions`
- [ ] 8.2（V1.1）回放筛选 query 参数
- [x] 8.3 广场页 stub + 添加引导（Server pool V1 stub）
- [ ] 8.4（V1.1）批量开关/归类 UI

## 9. 埋点与验收

- [x] 9.1 轻量埋点 utils（wx.reportAnalytics 降级 console）
- [x] 9.2 全页面 loading/empty/error 态
- [ ] 9.3 验收闭环（需 Server 联调 + 微信开发者工具）
- [x] 9.4 integration-boundary 代码守门
- [ ] 9.5 与 Server 联调（需配置 appid、域名、模板 ID）
