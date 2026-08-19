## Purpose

管理小程序用户资料与推送相关设置的权威存储，保证跨设备同步，并为推送校验链提供总开关、免打扰、学生党模式与仅大号等判定输入。

## ADDED Requirements

### Requirement: Profile returns settings and quota summary
系统 MUST 返回当前用户资料、设置摘要、授权状态镜像与额度摘要；openid 等敏感字段 MUST 脱敏或不返回。

#### Scenario: Authenticated profile fetch
- **WHEN** 合法 JWT 请求用户资料
- **THEN** 返回本人资料与额度摘要，且不含 session_key 与明文敏感凭证

### Requirement: User can update notification settings
系统 MUST 允许用户更新推送总开关、免打扰时段、学生党模式、仅推送大号等设置，并校验时间格式与枚举值。

#### Scenario: Update do-not-disturb crossing midnight
- **WHEN** 用户设置免打扰起止时间跨零点且格式合法
- **THEN** 系统保存设置，后续推送按跨零点规则判定

#### Scenario: Invalid settings rejected
- **WHEN** 用户提交非法枚举或非法时间格式
- **THEN** 系统拒绝更新并返回校验错误

### Requirement: Settings only affect owning user
用户设置读写 MUST 仅作用于 JWT 对应用户，其他用户不可读改。

#### Scenario: Cannot read another user settings
- **WHEN** 用户 A 的令牌尝试读取用户 B 的设置
- **THEN** 系统拒绝或仅返回 A 自己的数据
