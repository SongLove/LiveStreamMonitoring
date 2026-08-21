# 主播开播监控 · Client 端

uni-app + Vue3 + TypeScript 微信小程序，对接 Server `/api/v1`。

## 开发

```bash
pnpm install
# 若遇 ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION：项目已 pin pnpm@9.15.9 + .npmrc minimum-release-age=0
# 执行：corepack prepare pnpm@9.15.9 --activate
pnpm verify:api   # 对照 Swagger 验证接口（需 Server 运行在 4000）
pnpm dev:mp-weixin          # 本地：.env.development → http://localhost:4000/api/v1
pnpm dev:mp-weixin:prod    # 正式：.env.production → https://anchor-api.deepfate.cn/api/v1
pnpm build:mp-weixin:prod  # 正式包构建
```

**Swagger**: http://localhost:4000/docs · OpenAPI JSON: `/docs/json`

## 配置

| 变量 / 命令 | 说明 |
|---|---|
| `.env.development` → `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` |
| `.env.production` → `VITE_API_BASE_URL` | `https://anchor-api.deepfate.cn/api/v1` |
| `pnpm dev:mp-weixin:prod` | 用正式环境 API 启动微信小程序开发 |
| `manifest.json` → `mp-weixin.appid` | 微信小程序 AppID |

> 正式环境需在微信公众平台配置 request 合法域名：`https://anchor-api.deepfate.cn`

## 页面结构（对齐设计稿）

| Tab | 路径 | 说明 |
|---|---|---|
| 监控 | `pages/index/index` | 分类、监听列表、额度卡片、权限横幅 |
| 传媒监控 | `pages/media/index` | DIY 分类分段 + 单主播开关 |
| 直播回放 | `pages/replay/index` | 历史开播会话 |
| 设置 | `pages/settings/index` | 推送/免打扰/学生党/仅大号 |
| 帮助 | `pages/help/index` | 四项自助诊断 + FAQ |

二级页：`pages-sub/anchor/add|detail`、`category/manage`、`notify/logs`、`quota/guide`、`square/index`

## 边界

- 不直连抖音/B 站 API；开播状态与额度以 Server 为准
- 订阅授权仅用户点击触发，授权后调用 `/quota/refresh`

## 脚本

- `pnpm dev:mp-weixin` — 开发
- `pnpm build:mp-weixin` — 生产构建
- `pnpm type-check` — TS 检查
