from typing import Annotated

from fastapi import Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from common.aspect.db_seesion import DBSessionDependency
from common.aspect.pre_auth import CurrentUserDependency, PreAuthDependency
from common.router import APIRouterPro
from common.vo import DataResponseModel, ResponseBaseModel
from module_admin.entity.vo.user_vo import CurrentUserModel
from module_annotation.entity.vo.annotation_vo import (
    AnnotationDetailModel,
    AnnotationPermissionModel,
    AnnotationRevisionModel,
    AnnotationSubmitModel,
)
from module_annotation.service.annotation_service import AnnotationService
from utils.log_util import logger
from utils.response_util import ResponseUtil

annotation_controller = APIRouterPro(
    prefix='/api/annotation', order_num=32, tags=['标注-执行'], dependencies=[PreAuthDependency()]
)


@annotation_controller.get(
    '/detail',
    summary='获取标注详情',
    description='用于获取任务项的标注详情',
    response_model=DataResponseModel[AnnotationDetailModel],
)
async def get_annotation_detail(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    task_item_id: Annotated[int, Query(alias='taskItemId')],
) -> Response:
    result = await AnnotationService.get_annotation_detail_services(query_db, task_item_id)
    logger.info('获取成功')
    return ResponseUtil.success(data=result)


@annotation_controller.post(
    '/submit',
    summary='保存或提交标注',
    description='用于保存草稿或提交标注结果',
    response_model=ResponseBaseModel,
)
async def submit_annotation(
    request: Request,
    payload: AnnotationSubmitModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await AnnotationService.submit_annotation_services(query_db, payload, current_user)
    logger.info(result.message)
    return ResponseUtil.success(msg=result.message)


@annotation_controller.get(
    '/revisions',
    summary='获取标注版本列表',
    description='用于获取指定标注的历史版本',
    response_model=DataResponseModel[list[AnnotationRevisionModel]],
)
async def get_annotation_revisions(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    annotation_id: Annotated[int, Query(alias='annotationId')],
) -> Response:
    result = await AnnotationService.get_annotation_revisions_services(query_db, annotation_id)
    logger.info('获取成功')
    return ResponseUtil.success(data=result)


@annotation_controller.get(
    '/permissions',
    summary='获取标注权限',
    description='用于获取当前用户在项目中的标注权限',
    response_model=DataResponseModel[AnnotationPermissionModel],
)
async def get_annotation_permissions(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
    project_id: Annotated[int, Query(alias='projectId')],
) -> Response:
    result = await AnnotationService.get_annotation_permission_services(query_db, project_id, current_user)
    logger.info('获取成功')
    return ResponseUtil.success(data=result)
