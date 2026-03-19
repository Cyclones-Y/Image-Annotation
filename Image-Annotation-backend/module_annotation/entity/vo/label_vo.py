from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class LabelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    label_id: int = Field(description='标签ID')
    project_id: int = Field(description='项目ID')
    label_name: str = Field(description='标签名称')
    label_type: str = Field(default='object', description='标签类型')
    label_category: str = Field(default='default', description='标签分类')
    label_color: str = Field(default='#1677ff', description='标签颜色')
    usage_count: int = Field(default=0, description='使用频次')
    last_used_at: str | None = Field(default=None, description='最后使用时间')
    create_time: str | None = Field(default=None, description='创建时间')
    update_time: str | None = Field(default=None, description='更新时间')


class LabelPageQueryModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    keyword: str | None = Field(default=None, description='关键词')
    label_type: str | None = Field(default=None, description='标签类型')
    label_category: str | None = Field(default=None, description='标签分类')
    page_num: int = Field(default=1, description='页码')
    page_size: int = Field(default=20, description='每页条数')


class LabelCreateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    label_name: str = Field(description='标签名称')
    label_type: str = Field(default='object', description='标签类型')
    label_category: str = Field(default='default', description='标签分类')
    label_color: str = Field(default='#1677ff', description='标签颜色')


class LabelUpdateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    label_id: int = Field(description='标签ID')
    label_name: str | None = Field(default=None, description='标签名称')
    label_type: str | None = Field(default=None, description='标签类型')
    label_category: str | None = Field(default=None, description='标签分类')
    label_color: str | None = Field(default=None, description='标签颜色')


class LabelImportResultModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    total_count: int = Field(default=0, description='总行数')
    success_count: int = Field(default=0, description='成功数量')
    failed_count: int = Field(default=0, description='失败数量')
    errors: list[str] = Field(default_factory=list, description='错误信息')


class LabelTemplateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    template_id: int = Field(description='模板ID')
    template_code: str = Field(description='模板编码')
    project_id: int = Field(description='项目ID')
    template_name: str = Field(description='模板名称')
    template_category: str = Field(default='default', description='模板分类')
    template_version: int = Field(default=1, description='模板版本')
    visibility: Literal['private', 'project', 'public'] = Field(default='project', description='可见范围')
    is_latest: bool = Field(default=True, description='是否最新版本')
    owner_id: int | None = Field(default=None, description='创建人')
    labels: list[LabelModel] = Field(default_factory=list, description='模板标签集合')
    create_time: str | None = Field(default=None, description='创建时间')
    update_time: str | None = Field(default=None, description='更新时间')


class LabelTemplateQueryModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    keyword: str | None = Field(default=None, description='关键词')
    template_category: str | None = Field(default=None, description='模板分类')
    page_num: int = Field(default=1, description='页码')
    page_size: int = Field(default=20, description='每页条数')


class LabelTemplateCreateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    template_name: str = Field(description='模板名称')
    template_category: str = Field(default='default', description='模板分类')
    visibility: Literal['private', 'project', 'public'] = Field(default='project', description='可见范围')
    label_ids: list[int] = Field(default_factory=list, description='标签ID列表')
    description: str | None = Field(default=None, description='模板说明')


class LabelTemplateUpdateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    template_id: int = Field(description='模板ID')
    template_name: str | None = Field(default=None, description='模板名称')
    template_category: str | None = Field(default=None, description='模板分类')
    visibility: Literal['private', 'project', 'public'] | None = Field(default=None, description='可见范围')
    label_ids: list[int] | None = Field(default=None, description='标签ID列表')
    description: str | None = Field(default=None, description='模板说明')


class LabelMigrationPreviewModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    source_label_id: int = Field(description='源标签ID')
    target_label_id: int = Field(description='目标标签ID')
    affected_annotations: int = Field(default=0, description='受影响标注数')


class LabelMigrationApplyModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_id: int = Field(description='项目ID')
    source_label_id: int = Field(description='源标签ID')
    target_label_id: int = Field(description='目标标签ID')
    migrate_reason: str | None = Field(default=None, description='迁移原因')


class LabelMigrationResultModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    affected_annotations: int = Field(default=0, description='更新标注条数')
    migrated_at: datetime = Field(description='迁移时间')
