## Purpose

用户 DIY 分类的管理界面：创建、编辑、删除、排序、批量归类，与 Server user-category 能力对齐且不影响全局主播。

## ADDED Requirements

### Requirement: System views all and uncategorized
分类管理 MUST 固定展示「全部」「未分类」系统视图，不可删除；未分类为虚拟视图，不对应 POST categories。

#### Scenario: View uncategorized
- **WHEN** 用户进入未分类视图
- **THEN** 展示无 categoryIds 归属的订阅，无需创建 DB 记录

### Requirement: CRUD maps to categories API
创建、改名、颜色图标、排序 MUST 分别调用 POST/PATCH/DELETE `/categories`；客户端校验名称非空、长度与 obvious 非法字符。

#### Scenario: Create duplicate name
- **WHEN** Server 返回重名错误
- **THEN** 表单提示错误，不关闭编辑态

### Requirement: Delete category keeps subscriptions
删除分类 MUST 只移除分类关系；UI MUST 说明关联主播回到未分类，不取消监听。

#### Scenario: Delete category with anchors
- **WHEN** 用户确认删除含主播的分类
- **THEN** 调用 DELETE 成功后主播仍在监听列表，未分类数量增加

### Requirement: Multi-category assignment
同一主播 MAY 属于多个分类；批量归类 MUST 支持 POST `/categories/:id/subscriptions` 或 PATCH subscription categoryIds。

#### Scenario: Assign to two categories
- **WHEN** 用户将主播加入第二个分类
- **THEN** 两个分类列表均可见该主播

### Requirement: Reorder categories
分类排序 MUST 支持拖动或上移下移，提交 Server 排序字段。

#### Scenario: Drag sort
- **WHEN** 用户调整分类顺序并保存
- **THEN** 首页分类导航顺序与之一致

### Requirement: Batch categorize entry
分类为空或批量管理入口 MUST 引导选择多个监听主播进行归类（V1.1 可完整实现批量 UI，V1 至少支持单主播多分类）。

#### Scenario: Empty category
- **WHEN** 某 DIY 分类无主播
- **THEN** 展示空状态与「去归类」入口
