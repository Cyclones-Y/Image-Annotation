from typing import Annotated

from fastapi import File, Form, Query, Request, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from common.aspect.db_seesion import DBSessionDependency
from common.aspect.pre_auth import CurrentUserDependency, PreAuthDependency
from common.router import APIRouterPro
from common.vo import DataResponseModel, DynamicResponseModel, PageResponseModel, ResponseBaseModel
from module_admin.entity.vo.user_vo import CurrentUserModel
from module_annotation.entity.vo.label_vo import (
    LabelCreateModel,
    LabelImportResultModel,
    LabelMigrationApplyModel,
    LabelMigrationPreviewModel,
    LabelMigrationResultModel,
    LabelModel,
    LabelPageQueryModel,
    LabelTemplateCreateModel,
    LabelTemplateModel,
    LabelTemplateQueryModel,
    LabelTemplateUpdateModel,
    LabelUpdateModel,
)
from module_annotation.service.label_service import LabelService
from utils.log_util import logger
from utils.response_util import ResponseUtil

label_controller = APIRouterPro(
    prefix='/api/annotation', order_num=33, tags=['标注-标签管理'], dependencies=[PreAuthDependency()]
)


@label_controller.get('/labels', response_model=PageResponseModel[LabelModel], summary='标签分页查询')
async def list_labels(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    project_id: Annotated[int, Query(alias='projectId')],
    keyword: Annotated[str | None, Query(alias='keyword')] = None,
    label_type: Annotated[str | None, Query(alias='labelType')] = None,
    label_category: Annotated[str | None, Query(alias='labelCategory')] = None,
    page_num: Annotated[int, Query(alias='pageNum')] = 1,
    page_size: Annotated[int, Query(alias='pageSize')] = 20,
) -> Response:
    result = await LabelService.list_labels_services(
        query_db,
        LabelPageQueryModel(
            projectId=project_id,
            keyword=keyword,
            labelType=label_type,
            labelCategory=label_category,
            pageNum=page_num,
            pageSize=page_size,
        ),
    )
    logger.info('标签查询成功')
    return ResponseUtil.success(model_content=result)


@label_controller.post('/labels', response_model=DataResponseModel[LabelModel], summary='创建标签')
async def create_label(
    request: Request,
    payload: LabelCreateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await LabelService.create_label_services(query_db, payload, current_user)
    logger.info('标签创建成功')
    return ResponseUtil.success(data=result)


@label_controller.put('/labels', response_model=DataResponseModel[LabelModel], summary='更新标签')
async def update_label(
    request: Request,
    payload: LabelUpdateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await LabelService.update_label_services(query_db, payload, current_user)
    logger.info('标签更新成功')
    return ResponseUtil.success(data=result)


@label_controller.delete('/labels', response_model=ResponseBaseModel, summary='删除标签')
async def delete_label(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
    label_id: Annotated[int, Query(alias='labelId')],
) -> Response:
    result = await LabelService.delete_label_services(query_db, label_id, current_user)
    logger.info(result.message)
    return ResponseUtil.success(msg=result.message)


@label_controller.post(
    '/labels/import',
    response_model=DynamicResponseModel[LabelImportResultModel],
    summary='批量导入标签',
)
async def import_labels(
    request: Request,
    project_id: Annotated[int, Form(alias='projectId')],
    file: Annotated[UploadFile, File(...)],
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await LabelService.import_labels_services(query_db, project_id, file, current_user)
    logger.info('标签导入完成')
    return ResponseUtil.success(model_content=result)


@label_controller.get('/templates', response_model=PageResponseModel[LabelTemplateModel], summary='模板分页查询')
async def list_templates(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    project_id: Annotated[int, Query(alias='projectId')],
    keyword: Annotated[str | None, Query(alias='keyword')] = None,
    template_category: Annotated[str | None, Query(alias='templateCategory')] = None,
    page_num: Annotated[int, Query(alias='pageNum')] = 1,
    page_size: Annotated[int, Query(alias='pageSize')] = 20,
) -> Response:
    result = await LabelService.list_templates_services(
        query_db,
        LabelTemplateQueryModel(
            projectId=project_id,
            keyword=keyword,
            templateCategory=template_category,
            pageNum=page_num,
            pageSize=page_size,
        ),
    )
    logger.info('模板查询成功')
    return ResponseUtil.success(model_content=result)


@label_controller.post('/templates', response_model=DataResponseModel[LabelTemplateModel], summary='创建模板')
async def create_template(
    request: Request,
    payload: LabelTemplateCreateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await LabelService.create_template_services(query_db, payload, current_user)
    logger.info('模板创建成功')
    return ResponseUtil.success(data=result)


@label_controller.put('/templates', response_model=DataResponseModel[LabelTemplateModel], summary='更新模板')
async def update_template(
    request: Request,
    payload: LabelTemplateUpdateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await LabelService.update_template_services(query_db, payload, current_user)
    logger.info('模板更新成功')
    return ResponseUtil.success(data=result)


@label_controller.delete('/templates', response_model=ResponseBaseModel, summary='删除模板')
async def delete_template(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
    template_id: Annotated[int, Query(alias='templateId')],
) -> Response:
    result = await LabelService.delete_template_services(query_db, template_id, current_user)
    logger.info(result.message)
    return ResponseUtil.success(msg=result.message)


@label_controller.post(
    '/labels/migration/preview',
    response_model=DataResponseModel[LabelMigrationPreviewModel],
    summary='迁移预览',
)
async def preview_migration(
    request: Request,
    payload: LabelMigrationPreviewModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
) -> Response:
    result = await LabelService.preview_migration_services(query_db, payload)
    logger.info('迁移预览成功')
    return ResponseUtil.success(data=result)


@label_controller.post(
    '/labels/migration/apply',
    response_model=DataResponseModel[LabelMigrationResultModel],
    summary='执行迁移',
)
async def apply_migration(
    request: Request,
    payload: LabelMigrationApplyModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await LabelService.apply_migration_services(query_db, payload, current_user)
    logger.info('迁移执行成功')
    return ResponseUtil.success(data=result)
