## Purpose

提供用户私有 DIY 主播分类的创建、编辑、删除、排序与批量归类，保证分类数据跨设备同步且与公共推荐专题完全隔离。

## ADDED Requirements

### Requirement: Categories are private to owning user
分类数据 MUST 绑定当前用户；其他用户 MUST NOT 访问或修改。同用户分类名 MUST 唯一（未删除范围内），并受名称长度与数量上限约束。

#### Scenario: Create category success
- **WHEN** 用户创建不重名且未超上限的分类
- **THEN** 系统保存名称、颜色、图标、排序等信息并返回分类

#### Scenario: Duplicate name rejected
- **WHEN** 用户创建与已有未删除分类同名的分类
- **THEN** 系统拒绝并返回业务错误

### Requirement: One subscription can belong to multiple categories
同一用户可将同一订阅主播放入多个分类；分类关系建议挂在订阅侧（如 categoryIds），MUST NOT 写入全局 anchors。

#### Scenario: Assign anchor to multiple categories
- **WHEN** 用户将同一订阅加入两个分类
- **THEN** 两个分类都能看到该主播，且全局主播记录不变

### Requirement: Deleting category does not cancel listen
删除分类 MUST 只移除分类关系；MUST NOT 删除全局主播，MUST NOT 自动取消用户监听；关联主播进入未分类视图。

#### Scenario: Delete category keeps subscriptions
- **WHEN** 用户删除某分类且该分类下仍有订阅主播
- **THEN** 订阅关系仍存在，主播在未分类视图可见

### Requirement: Uncategorized is a virtual view
系统 MUST NOT 为每个用户预置「未分类」数据库记录；无分类归属的订阅由客户端/查询层作为未分类视图展示。

#### Scenario: Subscription without categories appears uncategorized
- **WHEN** 用户添加主播且未指定分类
- **THEN** 订阅创建成功且属于未分类视图
