from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ImageRowModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel)

    image_id: str = Field(description='图片ID')
    user_id: str | None = Field(default=None, description='用户ID')
    user_name: str | None = Field(default=None, description='用户名')
    tree_id: str | None = Field(default=None, description='树木ID')
    tree_code: str | None = Field(default=None, description='树木编号')
    tree_type: str | None = Field(default=None, description='树木类型')
    tree_part: str | None = Field(default=None, description='树木部位')
    file_name: str | None = Field(default=None, description='文件名')
    oss_url: str | None = Field(default=None, description='OSS地址')
    location_gps: str | None = Field(default=None, description='GPS坐标')
    capture_time: datetime | str | None = Field(default=None, description='拍摄时间')
    health_status: int | None = Field(default=None, description='健康状态')
    remarks: str | None = Field(default=None, description='备注')
    created_at: datetime | str | None = Field(default=None, description='创建时间')
    updated_at: datetime | str | None = Field(default=None, description='更新时间')
    capture_mode: int | None = Field(default=None, description='拍摄模式')
    
    # 保留旧字段以兼容现有前端（可选，如果前端也改了可以删掉）
    image_url: str | None = Field(default=None, description='兼容旧字段：图片URL')
    upload_time: datetime | str | None = Field(default=None, description='兼容旧字段：上传时间')
    width: int | None = Field(default=None, description='兼容旧字段：宽度')
    height: int | None = Field(default=None, description='兼容旧字段：高度')
