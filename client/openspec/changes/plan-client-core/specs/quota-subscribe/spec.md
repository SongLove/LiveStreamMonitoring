## Purpose

一次性订阅消息授权引导、额度展示与「增加推送次数」页面，严格遵循微信交互规范与 Server 额度权威模型。

## ADDED Requirements

### Requirement: Subscribe only on user click
调用 `wx.requestSubscribeMessage` MUST 绑定明确按钮（首页额度区、增加次数页、首次添加后引导）；禁止生命周期自动调用。

#### Scenario: Increase quota page
- **WHEN** 用户点击「授权一次」按钮
- **THEN** 弹出微信订阅窗，模板 ID 来自 config

### Requirement: Refresh quota after subscribe attempt
无论用户 accept、reject 或 ban，授权调用完成后 MUST 请求 `POST /quota/refresh` 并刷新 profile/quota 展示；MUST NOT 本地修改余额。

#### Scenario: User accepts template
- **WHEN** 弹窗返回 accept
- **THEN** Client 调用 refresh，展示 Server 返回的新余额（可能异步，可短轮询或提示稍后刷新）

### Requirement: Quota guide page copy
增加次数页 MUST 说明：一次授权对应一次下发权限、微信不允许批量勾选多次、余额上限（如 200）以 Server 为准；不得描述为付费商品或绝对送达承诺。

#### Scenario: Display rules
- **WHEN** 用户打开增加次数页
- **THEN** 可见当前余额、规则说明与连续点击授权入口

### Requirement: Template ids from config not hardcoded
tmplIds MUST 从 `/config/app` 或构建环境变量读取，支持多环境切换。

#### Scenario: Switch staging template
- **WHEN** 测试环境 config 下发不同模板 ID
- **THEN** 授权调用使用新 ID，无需改代码发版（若 config 热更新）

### Requirement: Post-first-add guidance
首次成功添加主播后 SHOULD 引导用户进入授权（按钮触发），不在添加成功回调里自动弹窗。

#### Scenario: First subscription created
- **WHEN** 用户首次添加监听成功
- **THEN** 展示引导页或对话框，用户点击后才 requestSubscribeMessage

### Requirement: Insufficient quota prompts guide not fault
额度不足时 MUST 引导至授权页，不展示「服务故障」类文案。

#### Scenario: Zero balance banner
- **WHEN** 余额为 0
- **THEN** 横幅引导增加次数，说明仍可查看状态
