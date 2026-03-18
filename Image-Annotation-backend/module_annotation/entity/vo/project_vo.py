from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ProjectModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, from_attributes=True)

    project_id: int | None = Field(default=None, description='项目ID')
    project_code: str = Field(description='项目编码')
    project_name: str = Field(description='项目名称')
    owner: str = Field(description='负责人')
    task_total: int = Field(default=0, description='任务总数')
    completed_count: int = Field(default=0, description='完成数')
    status: Literal['0', '1'] = Field(default='0', description='状态')
    deadline: datetime | str | None = Field(default=None, description='截止时间')
    create_time: datetime | str | None = Field(default=None, description='创建时间')
    remark: str | None = Field(default=None, description='备注')


class ProjectPageQueryModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    page_num: int = Field(default=1, description='页码')
    page_size: int = Field(default=10, description='每页')
    project_name: str | None = Field(default=None, description='项目名称')
    project_code: str | None = Field(default=None, description='项目编码')
    owner: str | None = Field(default=None, description='负责人')
    status: str | None = Field(default=None, description='状态')


class ProjectCreateModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    project_code: str = Field(description='项目编码')
    project_name: str = Field(description='项目名称')
    owner: str = Field(description='负责人')
    task_total: int = Field(default=0, description='任务总数')
    completed_count: int = Field(default=0, description='完成数')
    status: Literal['0', '1'] = Field(default='0', description='状态')
    deadline: str | None = Field(default=None, description='截止时间')
    remark: str | None = Field(default=None, description='备注')


class ProjectUpdateModel(ProjectCreateModel):
    project_id: int = Field(description='项目ID')
    create_time: datetime | str | None = Field(default=None, description='创建时间')
