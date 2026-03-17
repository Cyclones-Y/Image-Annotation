from typing import Annotated

from fastapi import Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from common.aspect.db_seesion import DBSessionDependency
from common.aspect.pre_auth import CurrentUserDependency, PreAuthDependency
from common.router import APIRouterPro
from common.vo import DataResponseModel, PageResponseModel
from module_admin.entity.vo.user_vo import CurrentUserModel
from module_annotation.entity.vo.annotation_vo import (
    DatasetImportCreateModel,
    DatasetImportJobModel,
    ExportCreateModel,
    ExportJobModel,
    TaskConfigModel,
    WorkflowSnapshotModel,
    WorkflowTaskCreateModel,
    WorkflowTaskModel,
    WorkflowTaskPageQueryModel,
)
from module_annotation.service.annotation_service import AnnotationService
from utils.log_util import logger
from utils.response_util import ResponseUtil

workflow_controller = APIRouterPro(
    prefix='/api/workflow', order_num=31, tags=['标注-工作流'], dependencies=[PreAuthDependency()]
)


@workflow_controller.get(
    '/tasks',
    summary='任务分页列表',
    description='用于获取项目下任务分页列表',
    response_model=PageResponseModel[WorkflowTaskModel],
)
async def get_workflow_tasks(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    project_id: Annotated[int, Query(alias='projectId')],
    page_num: Annotated[int, Query(alias='pageNum')] = 1,
    page_size: Annotated[int, Query(alias='pageSize')] = 20,
) -> Response:
    query_object = WorkflowTaskPageQueryModel(projectId=project_id, pageNum=page_num, pageSize=page_size)
    result = await AnnotationService.list_workflow_tasks_services(query_db, query_object)
    logger.info('获取成功')
    return ResponseUtil.success(model_content=result)


@workflow_controller.post(
    '/tasks',
    summary='创建任务',
    description='用于创建项目标注任务',
    response_model=DataResponseModel[WorkflowTaskModel],
)
async def create_workflow_task(
    request: Request,
    payload: WorkflowTaskCreateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
) -> Response:
    result = await AnnotationService.create_workflow_task_services(query_db, payload)
    logger.info('创建成功')
    return ResponseUtil.success(data=result)


@workflow_controller.get(
    '/config',
    summary='获取任务配置',
    description='用于获取项目的任务配置',
    response_model=DataResponseModel[TaskConfigModel],
)
async def get_task_config(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    project_id: Annotated[int, Query(alias='projectId')],
) -> Response:
    result = await AnnotationService.get_task_config_services(query_db, project_id)
    logger.info('获取成功')
    return ResponseUtil.success(data=result)


@workflow_controller.post(
    '/config',
    summary='保存任务配置',
    description='用于保存项目任务配置',
    response_model=DataResponseModel[TaskConfigModel],
)
async def save_task_config(
    request: Request,
    payload: TaskConfigModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await AnnotationService.save_task_config_services(query_db, payload, current_user)
    logger.info('保存成功')
    return ResponseUtil.success(data=result)


@workflow_controller.post(
    '/import',
    summary='创建导入任务',
    description='用于创建并返回导入任务状态',
    response_model=DataResponseModel[DatasetImportJobModel],
)
async def create_import_job(
    request: Request,
    payload: DatasetImportCreateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
) -> Response:
    result = await AnnotationService.create_import_job_services(query_db, payload)
    logger.info('创建成功')
    return ResponseUtil.success(data=result)


@workflow_controller.post(
    '/export',
    summary='创建导出任务',
    description='用于创建并返回导出任务状态',
    response_model=DataResponseModel[ExportJobModel],
)
async def create_export_job(
    request: Request,
    payload: ExportCreateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
) -> Response:
    result = await AnnotationService.create_export_job_services(query_db, payload)
    logger.info('创建成功')
    return ResponseUtil.success(data=result)


@workflow_controller.get(
    '/snapshot',
    summary='获取工作流快照',
    description='用于获取项目当前工作流快照',
    response_model=DataResponseModel[WorkflowSnapshotModel],
)
async def get_workflow_snapshot(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    project_id: Annotated[int, Query(alias='projectId')],
) -> Response:
    result = await AnnotationService.get_workflow_snapshot_services(query_db, project_id)
    logger.info('获取成功')
    return ResponseUtil.success(data=result)
