## Purpose

监控首页：分类导航、监听列表、开播态展示、额度卡片、权限异常横幅与总开关，是用户日常查看监听状态的核心页面。

## ADDED Requirements

### Requirement: Category navigation with counts
首页 MUST 展示系统视图「全部」「未分类」与用户 DIY 分类，并显示每类主播数量；切换分类 MUST 刷新或过滤当前列表数据。

#### Scenario: Switch to DIY category
- **WHEN** 用户点击某 DIY 分类
- **THEN** 列表仅展示该分类下订阅，数量与 Server 返回一致

### Requirement: Subscription list displays server live status only
列表项 MUST 展示头像、昵称、平台、平台 ID、liveStatus、statusUpdatedAt、分类标记；liveStatus MUST 直接绑定 Server 字段，Client MUST NOT 本地推断或覆盖。

#### Scenario: Anchor not live
- **WHEN** Server 返回未开播及更新时间
- **THEN** 展示未开播标签与「更新于 xxx」，不显示直播中样式

### Requirement: Live anchors sorted prominently
正在直播的主播 SHOULD 在列表内置顶或优先排序；具体顺序 MAY 遵循 Server 返回顺序或 Client 在不影响业务语义前提下按 liveStatus 分组。

#### Scenario: Mixed live and offline list
- **WHEN** 当前分类含开播与未开播主播
- **THEN** 开播中条目视觉上优先展示

### Requirement: Global notify master switch on home
首页 MUST 提供用户级开播提醒总开关，映射 `PUT /user/settings`；关闭 MUST NOT 删除订阅关系，关闭后 UI 状态立即反馈。

#### Scenario: Turn off master switch
- **WHEN** 用户关闭总开关并成功保存
- **THEN** 列表仍显示主播，但提醒相关 UI 表明已关闭总提醒

### Requirement: Quota card and auth anomaly banner
首页 MUST 展示剩余可推送次数与进入授权引导入口；当 Server 指示模板拒收、未授权或额度不足时 MUST 展示醒目横幅与修复/增加次数入口。

#### Scenario: Template rejected
- **WHEN** profile 或 diagnose 返回拒收状态
- **THEN** 首页展示权限异常横幅，引导帮助中心或设置修复

### Requirement: Empty state guides add or square
无监听主播时 MUST 展示空状态，引导添加主播或进入主播广场（若功能开关开启）。

#### Scenario: New user empty list
- **WHEN** 订阅列表为空
- **THEN** 展示引导文案与「添加主播」主按钮

### Requirement: Pull down refresh without forcing probe
首页 MUST 支持下拉刷新当前分类与状态；刷新 MUST NOT 声称会立即触发平台探测，仅重新拉取 Server 数据。

#### Scenario: Pull refresh
- **WHEN** 用户下拉刷新
- **THEN** 重新请求 subscriptions 与 profile，更新 statusUpdatedAt

### Requirement: No auto subscribe on first enter
首次进入首页 MUST NOT 自动调用订阅消息授权。

#### Scenario: First visit home tab
- **WHEN** 用户第一次打开监控 Tab
- **THEN** 不出现微信订阅弹窗
