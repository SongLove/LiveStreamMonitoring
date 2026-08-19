# 集成边界核对（task 8.3 / integration-boundary）

## 第三方 / 官方生态（禁止自研等价框架）

| 能力 | 采用 | 实现位置 | 状态 |
|---|---|---|---|
| HTTP/DI/校验 | NestJS + class-validator | 全局 ValidationPipe | ✅ |
| Mongo | `@nestjs/mongoose` | App modules | ✅ |
| 队列 | BullMQ + `@nestjs/bullmq` | `scheduler/` | ✅ |
| 队列面板 | Bull Board Express adapter | `bull-board/` → `/admin/queues` | ✅ |
| 限流 | `@nestjs/throttler` + Redis 令牌桶 | Throttler + `RedisService.takeToken` | ✅ |
| 配置 | `@nestjs/config` | `config/configuration.ts` | ✅ |
| 文档 | Swagger | `/docs` | ✅ |
| 健康检查 | Terminus | `/health` | ✅ |
| 日志 | nestjs-pino | App modules | ✅ |
| 节假日 | 第三方日历 API | `NotifyService.getHolidayDays` | ✅ |
| 微信 | 官方 HTTPS | `wechat/` | ✅ |
| 抖音状态 | 第三方优先 + stub 降级 | `crawler/providers/` | ✅ |

## 运行时禁止 LLM

| 路径 | 说明 | 核对 |
|---|---|---|
| 开播判定 | `LiveService.applyProbeResult` 仅用 Provider 归一化状态 + 状态机 | ✅ 无 LLM |
| 额度发放 | 仅微信回调 `grantFromWechatCallback` | ✅ 无 LLM |
| 推送决策 | `NotifyService.validateChain` 规则引擎 | ✅ 无 LLM |

## 密钥

- 微信 AppSecret、抖音 API Key、JWT、OSS、Admin 密码仅来自环境变量（见 `.env.example`）
- `.env` 已在 `.gitignore`，不得提交仓库
- Admin 用户列表 openid 脱敏（`maskOpenId`）

## 自研边界

允许：Provider 适配层、额度账本、状态机、校验链、RBAC 装饰器。  
禁止：自研队列、自研监控大盘、自研日历库、用 LLM 做权威判定。
