from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from common.vo import CrudResponseModel, PageModel
from exceptions.exception import ServiceException
from module_admin.entity.vo.user_vo import CurrentUserModel
from module_annotation.dao.project_dao import ProjectDao
from module_annotation.entity.vo.project_vo import ProjectCreateModel, ProjectModel, ProjectPageQueryModel, ProjectUpdateModel


class ProjectService:
    @classmethod
    def _to_datetime(cls, value: str | None) -> datetime | None:
        if not value:
            return None
        text = str(value).strip()
        if not text:
            return None
        try:
            return datetime.fromisoformat(text.replace('T', ' '))
        except ValueError:
            return None

    @classmethod
    def _to_text(cls, value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%d %H:%M:%S')
        return str(value)

    @classmethod
    def _row_to_model(cls, row: dict[str, Any]) -> ProjectModel:
        status = str(row.get('projectStatus') or '0')
        if status not in ['0', '1']:
            status = '0'
        return ProjectModel(
            projectId=int(row.get('projectId')),
            projectCode=row.get('projectCode') or '',
            projectName=row.get('projectName') or '',
            owner=row.get('ownerName') or '',
            taskTotal=int(row.get('taskTotal') or 0),
            completedCount=int(row.get('completedCount') or 0),
            status=status,
            deadline=cls._to_text(row.get('deadline')),
            createTime=cls._to_text(row.get('createTime')),
            remark=row.get('remark'),
        )

    @classmethod
    async def get_project_page_services(cls, db: AsyncSession, query_object: ProjectPageQueryModel) -> PageModel[ProjectModel]:
        page_result = await ProjectDao.list_projects(db, query_object)
        rows = [cls._row_to_model(row) for row in page_result.rows]
        return PageModel[ProjectModel](
            rows=rows,
            pageNum=page_result.page_num,
            pageSize=page_result.page_size,
            total=page_result.total,
            hasNext=page_result.has_next,
        )

    @classmethod
    async def get_project_detail_services(cls, db: AsyncSession, project_id: int) -> ProjectModel:
        row = await ProjectDao.get_project_by_id(db, project_id)
        if not row:
            raise ServiceException(message='项目不存在')
        return cls._row_to_model(dict(row._mapping))

    @classmethod
    async def create_project_services(
        cls, db: AsyncSession, payload: ProjectCreateModel, current_user: CurrentUserModel
    ) -> CrudResponseModel:
        if await ProjectDao.exists_project_code(db, payload.project_code):
            raise ServiceException(message='项目编码已存在')
        owner_user = await ProjectDao.get_user_by_owner_name(db, payload.owner)
        if not owner_user:
            raise ServiceException(message='负责人不存在')
        payload.deadline = cls._to_datetime(payload.deadline)
        try:
            await ProjectDao.create_project(
                db,
                payload,
                owner_id=int(owner_user.user_id),
                operator=current_user.user.user_name if current_user.user else 'system',
            )
            await db.commit()
            return CrudResponseModel(is_success=True, message='新增成功')
        except Exception as e:
            await db.rollback()
            raise e

    @classmethod
    async def update_project_services(
        cls, db: AsyncSession, payload: ProjectUpdateModel, current_user: CurrentUserModel
    ) -> CrudResponseModel:
        _ = await cls.get_project_detail_services(db, payload.project_id)
        if await ProjectDao.exists_project_code(db, payload.project_code, exclude_project_id=payload.project_id):
            raise ServiceException(message='项目编码已存在')
        owner_user = await ProjectDao.get_user_by_owner_name(db, payload.owner)
        if not owner_user:
            raise ServiceException(message='负责人不存在')
        payload.deadline = cls._to_datetime(payload.deadline)
        try:
            await ProjectDao.update_project(
                db,
                payload,
                owner_id=int(owner_user.user_id),
                operator=current_user.user.user_name if current_user.user else 'system',
            )
            await db.commit()
            return CrudResponseModel(is_success=True, message='修改成功')
        except Exception as e:
            await db.rollback()
            raise e

    @classmethod
    async def delete_project_services(
        cls, db: AsyncSession, project_id: int, current_user: CurrentUserModel
    ) -> CrudResponseModel:
        _ = await cls.get_project_detail_services(db, project_id)
        try:
            await ProjectDao.soft_delete_project(
                db, project_id, operator=current_user.user.user_name if current_user.user else 'system'
            )
            await db.commit()
            return CrudResponseModel(is_success=True, message='删除成功')
        except Exception as e:
            await db.rollback()
            raise e
