from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class OverviewMetricsModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    total_projects: int = Field(default=0, description='项目总数')
    active_projects: int = Field(default=0, description='进行中项目数')
    delayed_projects: int = Field(default=0, description='延期项目数')
    completed_projects: int = Field(default=0, description='完成项目数')


class TaskMetricsModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    pending_annotate: int = Field(default=0, description='待标注')
    annotating: int = Field(default=0, description='标注中')
    pending_review: int = Field(default=0, description='待审核')
    reviewed: int = Field(default=0, description='已完成')
    today_done: int = Field(default=0, description='今日完成')


class WorkbenchTaskModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    id: str = Field(description='任务标识')
    title: str = Field(description='任务标题')
    priority: Literal['high', 'medium', 'low'] = Field(default='medium', description='优先级')
    due_at: str | None = Field(default=None, description='截止时间')


class ActivityItemModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    id: str = Field(description='活动标识')
    time: str = Field(description='活动时间')
    action: str = Field(description='动作')
    target: str = Field(description='目标')


class ProjectProgressModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: str = Field(description='项目ID')
    project_name: str = Field(description='项目名称')
    progress: int = Field(description='进度')


class HomeDashboardModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    overview: OverviewMetricsModel = Field(description='首页概览')
    tasks: TaskMetricsModel = Field(description='任务统计')
    workbench_tasks: list[WorkbenchTaskModel] = Field(default_factory=list, description='工作台任务')
    activities: list[ActivityItemModel] = Field(default_factory=list, description='近期活动')
    project_progress_top: list[ProjectProgressModel] = Field(default_factory=list, description='项目进度')
    online_users: int = Field(default=0, description='在线用户')
    queue_backlog: int = Field(default=0, description='积压队列')
    api_success_rate: float = Field(default=100, description='接口成功率')
    avg_response_ms: int = Field(default=0, description='平均响应')


class HomeSystemModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    online_users: int = Field(default=0, description='在线用户')
    queue_backlog: int = Field(default=0, description='队列积压')
    api_success_rate: float = Field(default=100, description='接口成功率')
    avg_response_ms: int = Field(default=0, description='平均耗时')


class WorkflowTaskModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, from_attributes=True)

    task_id: str = Field(description='任务ID')
    project_id: str = Field(description='项目ID')
    task_name: str = Field(description='任务名称')
    assignee: str = Field(default='未分配', description='执行人')
    priority: Literal['high', 'medium', 'low'] = Field(default='medium', description='优先级')
    status: Literal['pending', 'in_progress', 'completed'] = Field(default='pending', description='状态')
    created_at: str | None = Field(default=None, description='创建时间')
    updated_at: str | None = Field(default=None, description='更新时间')


class WorkflowTaskPageQueryModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    page_num: int = Field(default=1, description='页码')
    page_size: int = Field(default=20, description='每页条数')


class WorkflowTaskCreateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    task_name: str = Field(description='任务名称')
    assignee: str = Field(description='执行人')
    priority: Literal['high', 'medium', 'low'] = Field(default='medium', description='优先级')


class TaskConfigModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    task_id: int | None = Field(default=None, description='任务ID')
    autosave_interval_sec: int = Field(default=15, description='自动保存间隔')
    review_required: bool = Field(default=True, description='是否强制质检')
    max_objects_per_image: int = Field(default=50, description='单图最大标注')
    quality_threshold: float = Field(default=0.8, description='质量阈值')
    allow_skip: bool = Field(default=True, description='允许跳过')


class DatasetImportCreateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    dataset_name: str = Field(description='数据集名称')
    total_images: int = Field(description='图片总量')


class DatasetImportJobModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    job_id: str = Field(description='任务ID')
    project_id: str = Field(description='项目ID')
    dataset_name: str = Field(description='数据集名称')
    total_images: int = Field(description='总数')
    imported_images: int = Field(description='已导入')
    status: Literal['processing', 'done', 'failed'] = Field(default='processing', description='状态')
    started_at: str = Field(description='开始时间')
    finished_at: str | None = Field(default=None, description='完成时间')


class ExportCreateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    format: Literal['COCO', 'VOC', 'YOLO'] = Field(description='导出格式')
    task_id: int | None = Field(default=None, description='任务ID')


class ExportJobModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    job_id: str = Field(description='任务ID')
    project_id: str = Field(description='项目ID')
    format: Literal['COCO', 'VOC', 'YOLO'] = Field(description='导出格式')
    status: Literal['processing', 'done', 'failed'] = Field(default='processing', description='状态')
    started_at: str = Field(description='开始时间')
    download_url: str | None = Field(default=None, description='下载地址')


class WorkflowSnapshotModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: str = Field(description='项目ID')
    current_step: Literal['project_created', 'task_created', 'configured', 'dataset_imported', 'annotating', 'exported'] = (
        Field(default='project_created', description='流程节点')
    )
    task_count: int = Field(default=0, description='任务数量')
    latest_task_name: str | None = Field(default=None, description='最新任务')
    latest_import_status: str | None = Field(default=None, description='导入状态')
    latest_export_status: str | None = Field(default=None, description='导出状态')
    completion_percent: int = Field(default=0, description='完成度')


class AnnotationDetailQueryModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    task_item_id: int = Field(description='任务项ID')


class AnnotationDetailModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    annotation_id: int | None = Field(default=None, description='标注ID')
    task_item_id: int = Field(description='任务项ID')
    project_id: int = Field(description='项目ID')
    task_id: int = Field(description='任务ID')
    item_id: int = Field(description='数据项ID')
    annotation_status: str = Field(default='0', description='标注状态')
    current_revision_no: int = Field(default=0, description='当前版本')
    result_json: dict[str, Any] = Field(default_factory=dict, description='标注结果')
    schema_version: int | None = Field(default=None, description='体系版本')
    annotator_id: int | None = Field(default=None, description='标注人')
    submitted_at: str | None = Field(default=None, description='提交时间')
    update_time: str | None = Field(default=None, description='更新时间')


class AnnotationSubmitModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    task_item_id: int = Field(description='任务项ID')
    result_json: dict[str, Any] = Field(default_factory=dict, description='标注结果')
    submit: bool = Field(default=False, description='是否提交')
    schema_version: int | None = Field(default=None, description='体系版本')
    change_reason: str | None = Field(default=None, description='变更原因')


class AnnotationRevisionModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    revision_id: int = Field(description='版本ID')
    annotation_id: int = Field(description='标注ID')
    revision_no: int = Field(description='版本号')
    operation_type: str = Field(description='操作类型')
    result_json: dict[str, Any] = Field(default_factory=dict, description='标注内容')
    changed_by: int | None = Field(default=None, description='变更人')
    change_reason: str | None = Field(default=None, description='变更原因')
    create_time: str | None = Field(default=None, description='创建时间')


class AnnotationPermissionModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    user_id: int = Field(description='用户ID')
    can_annotate: bool = Field(default=False, description='可标注')
    can_review: bool = Field(default=False, description='可审核')
    can_export: bool = Field(default=False, description='可导出')
    roles: list[str] = Field(default_factory=list, description='角色集合')
