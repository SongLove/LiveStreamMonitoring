# 抖音 Playwright fetchStatus 实现计划

> Using writing-plans skill.

## 文件

| 文件 | 职责 |
|---|---|
| `douyin-third-party.provider.ts` | 未配置 skip |
| `douyin-live-parse.ts` + spec | 解析 room_status / 标题等 |
| `douyin-playwright.provider.ts` | 实现 fetchStatus |
| `scheduler.processors.ts` | 抖音用 roomId 探测 + 双键匹配 |
| `crawler-resolve.spec.ts` / 新 chain status spec | 覆盖 skip → pw |

## 任务

1. 三方 fetchStatus 未配置 → skip + 单测
2. `parseDouyinLivePayload` 单元测试先行
3. Playwright fetchStatus 实现
4. Scheduler ID 映射
5. `npm test` 验收
