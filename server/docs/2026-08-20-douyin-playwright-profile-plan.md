# Douyin Playwright Profile Resolve — Implementation Plan

> **For agentic workers:** Use executing-plans. Steps use checkbox syntax.

**Goal:** 搜索/添加抖音主播时，第三方优先、失败或未配置则 Playwright 同步拉取真实昵称与头像。

**Architecture:** `CrawlerService.resolve` 走降级链；第三方未配置时 skip；`DouyinPlaywrightProvider` + `DouyinBrowserPool` 解析页面；开播状态仍用现有 `fetchStatus` 链。

**Tech Stack:** NestJS, Playwright Chromium, Jest

**Spec:** `server/docs/2026-08-20-douyin-playwright-profile-design.md`

## Files

- Create: `server/src/modules/crawler/providers/provider-skip.error.ts`
- Create: `server/src/modules/crawler/providers/douyin-profile-parse.ts`
- Create: `server/src/modules/crawler/providers/douyin-browser.pool.ts`
- Create: `server/src/modules/crawler/providers/douyin-playwright.provider.ts`
- Create: `server/src/modules/crawler/providers/douyin-profile-parse.spec.ts`
- Create: `server/src/modules/crawler/crawler-resolve.spec.ts`
- Modify: `douyin-third-party.provider.ts`, `douyin-signature.stub.ts`, `provider.registry.ts`, `crawler.service.ts`, `provider-chain.service.ts`, `crawler.module.ts`, `configuration.ts`, `.env.example`
- Delete: `douyin-playwright.stub.ts`

## Tasks

- [x] Task 1: ProviderSkippedError + resolveChain + third-party/sign skip
- [x] Task 2: douyin-profile-parse + unit tests (fixtures)
- [x] Task 3: DouyinBrowserPool + DouyinPlaywrightProvider
- [x] Task 4: Wire module/config/env; resolve chain unit test
- [x] Task 5: `npm test` 通过；可选 smoke 文档说明
