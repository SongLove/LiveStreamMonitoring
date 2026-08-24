# 抖音 Playwright 开播探测设计

日期：2026-08-24  
状态：已确认

## 目标

订阅后 Worker 轮询能拿到真实抖音开播状态（无三方 Key 时靠 Playwright）。

## 方案

1. **修假 offline**：`DouyinThirdPartyProvider.fetchStatus` 未配置时 `ProviderSkippedError`，不再伪造全员 `not_live`。
2. **ID 映射**：探测用 `roomId`（抖音号）优先；结果按 `platformUid` 或 `roomId` 回填 anchor。
3. **Playwright `fetchStatus`**：打开 `https://live.douyin.com/{id}`，拦截 `webcast/room` JSON；`room_status===0` 为开播（与现有三方约定一致）；明确失败返回 `probe_failed`。

## 非目标

搜索时不查开播；签名直连；改 Client UI。
