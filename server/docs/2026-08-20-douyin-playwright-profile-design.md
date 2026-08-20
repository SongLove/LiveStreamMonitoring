# 抖音主播资料解析（Playwright 降级）设计

日期：2026-08-20  
范围：搜索/添加时同步拉取真实昵称与头像；开播状态仍由订阅后 Worker 探测。

## 背景与约束

- 产品约定：按抖音号（如 `kelie329157`）添加，不支持昵称搜索。
- 无第三方时也需拿到真实昵称 + 头像。
- 已选路线：**Playwright**；优先级：**第三方优先，未配置/失败再 Playwright**。
- UX：**同步等待**，搜索/resolve 接口返回完整资料后再响应。
- 时机：搜索时做资料解析；用户订阅开播后，Worker 再做开播状态探测。

## 目标

1. 输入抖音号 / sec_uid / 主页链接时，返回真实 `nickname`、`avatarUrl`、稳定 `platformUid`（优先 sec_uid）。
2. 未配置 TikHub 时，不硬失败，自动落到 Playwright。
3. 不假解析入库（禁止把抖音号当昵称糊弄过去当「成功」）。
4. 本轮不实现 Playwright 开播探测、签名直连、异步占位刷新。

## 架构与数据流

```
搜索/resolve(抖音号)
  → 第三方已配置？→ TikHub profile → 成功则返回
  → 否则 / 失败 → Playwright：打开用户页或搜索用户
       → 解析 nickname / avatar / sec_uid
       → upsert anchors（platformUid=sec_uid 优先，roomId=抖音号）
  → 同步返回给 Client

订阅后 Worker poll
  → 现有 fetchStatus 链（第三方优先；Playwright 开播本次不做）
```

当前缺口：`CrawlerService.resolve` 只调 `primary()`（第三方），无降级；`DouyinPlaywrightStubProvider` 未实现。

## 组件拆分

| 组件 | 职责 |
|------|------|
| `DouyinPlaywrightProvider` | 替换 stub；实现真实 `resolve`；`fetchStatus` 仍不可用（本轮不做开播） |
| `DouyinBrowserPool` | 单例 Chromium、全局并发信号量（默认 1）、超时控制；进程内复用 |
| `CrawlerService.resolve` | 改为降级链：`third → sign(跳过) → playwright` |
| `DouyinThirdPartyProvider` | 未配置时 resolve 记为 skip，便于落到 Playwright（不再强制「必须配置 TikHub」） |
| `parseDouyinInput` | 不变；仍只认抖音号 / sec_uid / 主页 |

### Playwright 解析策略

1. `unique_id`：打开 `https://www.douyin.com/search/{id}?type=user`，匹配用户卡或进入主页。
2. `sec_uid`：直接打开 `https://www.douyin.com/user/{sec_uid}`。
3. 优先从 `__NEXT_DATA__` / `RENDER_DATA` / 可见 DOM 取 nickname、avatar、sec_uid。
4. 输出对齐 `NormalizedAnchorProfile`。

### 依赖与运维

- 增加 `playwright` 依赖；本机/镜像需 `npx playwright install chromium`。
- `.env.example` / README 注明浏览器安装与可选 `DOUYIN_PW_*`（超时、并发）。

## 错误处理

| 情况 | 行为 |
|------|------|
| 第三方未配置 | skip，链落到 Playwright |
| 第三方超时/4xx/空壳 | 记失败，继续下一层 |
| 签名 stub | 直接跳过/失败（本轮不实现） |
| Playwright 超时 / 验证码 / DOM 变更 | `BadRequestException`：拉取失败请稍后重试；不假解析入库 |
| 抖音号不存在 | `未找到抖音号：xxx` |
| 并发占满 | 短等待；默认串行 1 槽，超时失败 |
| Worker 开播链 | 不变；PW `fetchStatus` 不可用时链走第三方或 `probe_failed` |

## 测试

- 单元：`resolve` 降级顺序（第三方 fail → 调用 Playwright）。
- 单元：未配置第三方时不硬失败。
- 单元：Playwright 解析 fixture → 正确 nickname/avatar/sec_uid。
- 可选 smoke：`DOUYIN_PW_SMOKE=1` 时对真实抖音号跑一次（默认 skip）。
- 回归：抖音号校验、禁止昵称搜索、B 站路径不受影响。

## 非目标

- Playwright 开播探测
- 签名直连
- 异步占位再刷资料
- 头像转存 OSS

## 验收标准

- 未配 `DOUYIN_THIRD_PARTY_*` 时，输入有效抖音号可同步拿到非空昵称（≠ 仅抖音号占位）或明确失败信息。
- 已配第三方且可用时，仍优先第三方；第三方失败时可落到 Playwright。
- 订阅后开播探测行为与本改动前一致（不依赖 Playwright 开播）。
- 输入昵称 / 搜索页链接仍被拒绝。
