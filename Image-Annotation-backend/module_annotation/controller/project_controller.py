from typing import Annotated

from fastapi import Path, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from common.aspect.db_seesion import DBSessionDependency
from common.aspect.pre_auth import CurrentUserDependency, PreAuthDependency
from common.router import APIRouterPro
from common.vo import DataResponseModel, PageResponseModel, ResponseBaseModel
from module_admin.entity.vo.user_vo import CurrentUserModel
from module_annotation.entity.vo.project_vo import (
    ProjectCreateModel,
    ProjectModel,
    ProjectPageQueryModel,
    ProjectUpdateModel,
)
from module_annotation.service.project_service import ProjectService
from utils.log_util import logger
from utils.response_util import ResponseUtil

project_controller = APIRouterPro(
    prefix='/system/project', order_num=33, tags=['项目管理'], dependencies=[PreAuthDependency()]
)


@project_controller.get(
    '/list',
    summary='项目分页列表',
    description='用于获取项目管理分页列表',
    response_model=PageResponseModel[ProjectModel],
)
async def list_project(
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    page_num: Annotated[int, Query(alias='pageNum')] = 1,
    page_size: Annotated[int, Query(alias='pageSize')] = 10,
    project_name: Annotated[str | None, Query(alias='projectName')] = None,
    project_code: Annotated[str | None, Query(alias='projectCode')] = None,
    owner: Annotated[str | None, Query()] = None,
    status: Annotated[str | None, Query()] = None,
) -> Response:
    query_object = ProjectPageQueryModel(
        pageNum=page_num,
        pageSize=page_size,
        projectName=project_name,
        projectCode=project_code,
        owner=owner,
        status=status,
    )
    result = await ProjectService.get_project_page_services(query_db, query_object)
    logger.info('获取成功')
    return ResponseUtil.success(model_content=result)


@project_controller.get(
    '/{project_id}',
    summary='项目详情',
    description='用于获取项目详情',
    response_model=DataResponseModel[ProjectModel],
)
async def get_project_detail(
    project_id: Annotated[int, Path(description='项目ID')],
    query_db: Annotated[AsyncSession, DBSessionDependency()],
) -> Response:
    result = await ProjectService.get_project_detail_services(query_db, project_id)
    logger.info('获取成功')
    return ResponseUtil.success(data=result)


@project_controller.post(
    '',
    summary='创建项目',
    description='用于创建项目',
    response_model=ResponseBaseModel,
)
async def create_project(
    payload: ProjectCreateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await ProjectService.create_project_services(query_db, payload, current_user)
    logger.info(result.message)
    return ResponseUtil.success(msg=result.message)


@project_controller.put(
    '',
    summary='修改项目',
    description='用于修改项目',
    response_model=ResponseBaseModel,
)
async def update_project(
    payload: ProjectUpdateModel,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await ProjectService.update_project_services(query_db, payload, current_user)
    logger.info(result.message)
    return ResponseUtil.success(msg=result.message)


@project_controller.delete(
    '/{project_id}',
    summary='删除项目',
    description='用于删除项目',
    response_model=ResponseBaseModel,
)
async def delete_project(
    project_id: Annotated[int, Path(description='项目ID')],
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await ProjectService.delete_project_services(query_db, project_id, current_user)
    logger.info(result.message)
    return ResponseUtil.success(msg=result.message)
