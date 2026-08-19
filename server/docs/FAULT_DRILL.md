# 故障演练清单（task 8.2）

用于验证 Server 在常见故障下的行为是否符合 PRD / OpenSpec。

## 1. Redis 重启

- [ ] 停止 Redis，确认 API 健康检查 `redis` 变为异常
- [ ] 启动 Redis 后，`access_token` 可重新缓存
- [ ] BullMQ 任务在 Redis 恢复后可继续消费（已入库任务不丢）
- [ ] 分布式锁（poll-schedule / access_token）恢复后无死锁

## 2. WeChat access_token 失效

- [ ] 手动删除 Redis key `wechat:access_token`
- [ ] 触发订阅消息发送，观察自动刷新（分布式锁串行）
- [ ] 模拟 `errcode=40001`：强制刷新后重试，不因该错误直接返还额度

## 3. Provider 超时 / 全失败

- [ ] 断网或 mock 超时：B 站 / 抖音探测返回 `probe_failed`
- [ ] 确认**不会**伪造开播或下播状态机跳转
- [ ] 抖音链路：第三方失败后尝试下一层；全部失败只告警

## 4. 重复微信回调

- [ ] 同一 `accept` 回调重放两次
- [ ] `quota_ledger.idempotencyKey` 唯一，余额只 +1 一次

## 5. Worker 重启

- [ ] 推送或探测任务执行中杀掉 Worker
- [ ] 重启后 BullMQ 重新投递未完成 job（幂等键保证不重复扣额度 / 不重复开播会话）

## 6. 额度与推送边界

- [ ] 余额为 0：校验链跳过，`notify_logs` 记 `quota_insufficient`，无扣减
- [ ] Client `POST /api/v1/quota/grant`（若暴露）被拒绝
- [ ] `POST /api/v1/quota/refresh` 只读，不发放

## 7. B 站轮播

- [ ] `live_status=2` 归一化为非开播，不创建 `live_sessions`、不投递 notify
