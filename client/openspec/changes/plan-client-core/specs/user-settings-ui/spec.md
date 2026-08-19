## Purpose

设置 Tab：推送总开关、免打扰、仅推送大号、学生党模式、默认分类与本地缓存清理。

## ADDED Requirements

### Requirement: Settings persist via user settings API
开播提醒总开关、免打扰时段、仅大号、学生党、默认分类 MUST 通过 `PUT /user/settings` 保存；成功/失败有明确反馈。

#### Scenario: Save quiet hours
- **WHEN** 用户设置 23:00-08:00 免打扰并保存
- **THEN** Server 持久化，Client 展示已保存状态

### Requirement: Cross-midnight quiet hours hint
免打扰跨午夜 MUST 有 UI 说明（如「22:00 至 次日 08:00」），避免用户误解。

#### Scenario: Overnight DND
- **WHEN** 开始时间大于结束时间
- **THEN** 展示跨天提示文案

### Requirement: Student mode shows rule summary
学生党模式开关 MUST 附带规则说明：依赖 Server 节假日配置，Client 不维护假日表。

#### Scenario: Enable student mode
- **WHEN** 用户开启学生党模式
- **THEN** 可见「仅节假日推送」等说明文字

### Requirement: Big anchor only depends on server tags
仅推送大号 MUST 说明依赖后台主播标签，未标注时提示可能无法准确筛选。

#### Scenario: Toggle big anchor only
- **WHEN** 用户开启仅大号
- **THEN** 展示依赖后台标签的说明

### Requirement: Clear local cache does not delete server data
「清除本地缓存」MUST 只清理 Pinia/Storage 中的 Client 缓存，并明确告知不删除云端监听与分类。

#### Scenario: Clear local cache
- **WHEN** 用户确认清除本地缓存
- **THEN** 本地 token 以外业务缓存清除，重新登录或拉取后从 Server 恢复

### Requirement: Default category for new subscriptions
若支持默认分类设置，新关注流程 SHOULD 预选该分类，用户仍可更改。

#### Scenario: Default category set
- **WHEN** 用户设置默认分类为「常看」
- **THEN** 下次关注弹窗默认选中该分类
