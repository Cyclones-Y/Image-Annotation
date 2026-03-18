# module_annotation 接口文档

## 1. 前端功能模块与接口需求清单

### 1.1 首页数据展示
- `GET /api/home/overview`：项目概览、任务统计、工作台任务、最近活动、项目进度。
- `GET /api/home/system`：在线用户、队列积压、接口成功率、平均响应耗时。

### 1.2 标注任务工作流
- `GET /api/workflow/tasks`：按项目分页查询任务列表。
- `POST /api/workflow/tasks`：创建标注任务。
- `GET /api/workflow/config`：读取任务配置。
- `POST /api/workflow/config`：保存任务配置。
- `POST /api/workflow/import`：创建导入任务并返回状态。
- `POST /api/workflow/export`：创建导出任务并返回状态。
- `GET /api/workflow/snapshot`：查询项目工作流快照。

### 1.3 项目管理
- `GET /system/project/list`：项目分页查询（项目名称、编码、负责人、状态）。
- `GET /system/project/{projectId}`：项目详情。
- `POST /system/project`：创建项目。
- `PUT /system/project`：修改项目。
- `DELETE /system/project/{projectId}`：删除项目（软删除）。

### 1.4 标注执行
- `GET /api/annotation/detail`：按任务项获取标注详情。
- `POST /api/annotation/submit`：保存草稿或提交标注结果。
- `GET /api/annotation/revisions`：查询标注版本历史。

### 1.5 用户权限管理
- `GET /api/annotation/permissions`：查询当前用户在项目内的标注/审核/导出权限。

## 2. 统一约定

- 认证：统一 Bearer Token，接口使用 `PreAuthDependency`。
- 返回格式：统一 `code/msg/success/time`，数据字段通过 `data` 或分页 `rows/pageNum/pageSize/total/hasNext` 返回。
- 分页参数：统一 `pageNum/pageSize`。
- 异常处理：业务异常抛出 `ServiceException`，由全局异常处理器统一转换响应。
- 日志规范：控制层记录成功日志，服务层执行事务提交与回滚。

## 3. 已实现接口列表

| 模块 | 方法 | 路径 | 说明 |
|---|---|---|---|
| 首页 | GET | `/api/home/overview` | 首页聚合数据 |
| 首页 | GET | `/api/home/system` | 首页实时指标 |
| 项目 | GET | `/system/project/list` | 项目分页列表 |
| 项目 | GET | `/system/project/{projectId}` | 项目详情 |
| 项目 | POST | `/system/project` | 创建项目 |
| 项目 | PUT | `/system/project` | 修改项目 |
| 项目 | DELETE | `/system/project/{projectId}` | 删除项目 |
| 工作流 | GET | `/api/workflow/tasks` | 任务分页列表 |
| 工作流 | POST | `/api/workflow/tasks` | 新建任务 |
| 工作流 | GET | `/api/workflow/config` | 获取任务配置 |
| 工作流 | POST | `/api/workflow/config` | 保存任务配置 |
| 工作流 | POST | `/api/workflow/import` | 创建导入任务 |
| 工作流 | POST | `/api/workflow/export` | 创建导出任务 |
| 工作流 | GET | `/api/workflow/snapshot` | 工作流快照 |
| 标注 | GET | `/api/annotation/detail` | 标注详情 |
| 标注 | POST | `/api/annotation/submit` | 保存/提交标注 |
| 标注 | GET | `/api/annotation/revisions` | 标注版本历史 |
| 权限 | GET | `/api/annotation/permissions` | 项目权限 |
