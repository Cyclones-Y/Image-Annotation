from typing import Annotated

from fastapi import Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from common.aspect.db_seesion import DBSessionDependency
from common.aspect.pre_auth import CurrentUserDependency, PreAuthDependency
from common.router import APIRouterPro
from common.vo import DataResponseModel
from module_admin.entity.vo.user_vo import CurrentUserModel
from module_annotation.entity.vo.annotation_vo import HomeDashboardModel, HomeSystemModel
from module_annotation.service.annotation_service import AnnotationService
from utils.log_util import logger
from utils.response_util import ResponseUtil

home_controller = APIRouterPro(prefix='/api/home', order_num=30, tags=['标注-首页'], dependencies=[PreAuthDependency()])


@home_controller.get(
    '/overview',
    summary='首页概览数据',
    description='用于获取首页概览、任务、活动和项目进度信息',
    response_model=DataResponseModel[HomeDashboardModel],
)
async def get_home_overview(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
    current_user: Annotated[CurrentUserModel, CurrentUserDependency()],
) -> Response:
    result = await AnnotationService.get_home_overview_services(request, query_db, current_user)
    logger.info('获取成功')
    return ResponseUtil.success(data=result)


@home_controller.get(
    '/system',
    summary='首页实时系统数据',
    description='用于获取首页顶部实时系统指标',
    response_model=DataResponseModel[HomeSystemModel],
)
async def get_home_system(
    request: Request,
    query_db: Annotated[AsyncSession, DBSessionDependency()],
) -> Response:
    result = await AnnotationService.get_home_system_services(query_db)
    logger.info('获取成功')
    return ResponseUtil.success(data=result)
