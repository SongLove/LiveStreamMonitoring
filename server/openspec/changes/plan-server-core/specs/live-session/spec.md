## Purpose

基于平台探测结果维护主播开播状态机与唯一开播会话，通过二次确认与最短重播间隔防止误报与重复开播事件。

## ADDED Requirements

### Requirement: Live detection uses state machine with confirmation
状态流转 MUST 遵循「未开播 → 待确认 → 直播中 → 未开播」。首次探测到直播中 MUST 进入待确认并延迟复查；低置信度结果 MUST 强制二次确认。连续确认后才生成 live_session。

#### Scenario: Single live flicker does not create session
- **WHEN** 一次探测显示直播中，复查显示未开播
- **THEN** 系统不创建开播会话、不触发推送分发

#### Scenario: Confirmed live creates one session
- **WHEN** 连续确认均为直播中
- **THEN** 系统创建唯一 live_session 并投递推送分发任务

### Requirement: Offline requires consecutive non-live polls
下播确认 MUST 要求连续多次未开播，防止网络抖动造成状态反复。

#### Scenario: Transient offline does not end session early
- **WHEN** 直播中主播单次探测未开播但未达连续阈值
- **THEN** 会话保持直播中，不立即结束

### Requirement: Session key is unique and idempotent
会话键 MUST 唯一（如主播 ID + 开播时间按分钟取整）；重复写入冲突 MUST 视为已处理并忽略，不得重复推送展开。

#### Scenario: Duplicate confirmed detection ignored
- **WHEN** 同一开播被多次确认并尝试写入会话
- **THEN** 仅保留一条 live_session

### Requirement: Minimum rebroadcast interval
同主播 MUST 存在最短重播间隔（默认 30 分钟可配置）；间隔内短暂掉线恢复 MUST NOT 产生新开播事件。

#### Scenario: Quick reconnect within cooldown
- **WHEN** 主播下播后在最短重播间隔内再次被判定开播
- **THEN** 系统不创建新的开播会话

### Requirement: Provider total failure does not fabricate state transition
全部 Provider 失败时，系统 MUST NOT 将技术异常误判为开播或下播，仅记录故障与告警。

#### Scenario: All providers fail leaves previous state
- **WHEN** 某次探测链路全部失败
- **THEN** 不生成开播事件，不因失败直接改写为下播确认
