## Purpose

维护全局共享主播池，以平台稳定主键去重，提供搜索、链接解析与资料刷新，使探测成本与关注人数解耦。

## ADDED Requirements

### Requirement: Anchors are globally unique by platform and stable uid
系统 MUST 以 `platform + platformUid`（稳定主键）唯一创建或复用主播实体；展示用 ID（抖音号、B 站短号）MUST NOT 作为探测主键。

#### Scenario: Two users add same anchor
- **WHEN** 两名用户先后添加同一平台同一稳定主键主播
- **THEN** 全局只存在一条 anchors 记录，各自仅创建自己的订阅关系

### Requirement: Resolve accepts keyword, id, link, or share text
系统 MUST 对关键词、平台 ID、直播间链接或分享文案做输入归一化，并调用对应 Provider 解析出稳定主键与公开资料后入库或复用。

#### Scenario: Resolve bilibili room short id
- **WHEN** 用户提交 B 站直播间短号或链接
- **THEN** 系统解析出 mid/稳定主键与公开资料，并返回可关注的主播实体

#### Scenario: Resolve failure returns actionable error
- **WHEN** Provider 无法解析输入
- **THEN** 系统返回明确失败原因，且不创建无效主播记录

### Requirement: Search prefers local pool then provider
搜索 MUST 先查本地主播池；未命中时可调用 Provider 解析并入池，且 MUST 限流。

#### Scenario: Local hit returns without external call requirement
- **WHEN** 关键词命中本地池中已有主播
- **THEN** 系统返回本地结果并可在限流策略内避免不必要的外部探测

### Requirement: Poll tier and validity are maintained
系统 MUST 维护 pollTier、连续失败计数与有效性；连续失败达到阈值时可暂停探测并可供运维处理。

#### Scenario: Repeated failures pause polling
- **WHEN** 某主播连续探测失败达到配置阈值
- **THEN** 系统将其置为暂停探测状态并记录可运维信息
