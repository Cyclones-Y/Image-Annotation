from datetime import datetime

from sqlalchemy import Select, and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from common.vo import PageModel
from module_admin.entity.do.user_do import SysUser
from module_annotation.entity.do.annotation_do import AnnoProject, AnnoTask, AnnoTaskItem
from module_annotation.entity.vo.project_vo import ProjectCreateModel, ProjectPageQueryModel, ProjectUpdateModel
from utils.page_util import PageUtil


class ProjectDao:
    @classmethod
    async def list_projects(cls, db: AsyncSession, query_object: ProjectPageQueryModel) -> PageModel:
        task_sub = (
            select(AnnoTask.project_id.label('project_id'), func.count(AnnoTaskItem.task_item_id).label('task_total'))
            .join(AnnoTaskItem, AnnoTaskItem.task_id == AnnoTask.task_id, isouter=True)
            .group_by(AnnoTask.project_id)
            .subquery()
        )
        done_sub = (
            select(AnnoTask.project_id.label('project_id'), func.count(AnnoTaskItem.task_item_id).label('completed_count'))
            .join(AnnoTaskItem, AnnoTaskItem.task_id == AnnoTask.task_id)
            .where(AnnoTaskItem.task_item_status == '4')
            .group_by(AnnoTask.project_id)
            .subquery()
        )
        query: Select = (
            select(
                AnnoProject.project_id,
                AnnoProject.project_code,
                AnnoProject.project_name,
                SysUser.user_name.label('owner_name'),
                func.coalesce(task_sub.c.task_total, 0).label('task_total'),
                func.coalesce(done_sub.c.completed_count, 0).label('completed_count'),
                AnnoProject.project_status,
                AnnoProject.deadline,
                AnnoProject.create_time,
                AnnoProject.remark,
            )
            .join(SysUser, SysUser.user_id == AnnoProject.owner_id, isouter=True)
            .join(task_sub, task_sub.c.project_id == AnnoProject.project_id, isouter=True)
            .join(done_sub, done_sub.c.project_id == AnnoProject.project_id, isouter=True)
            .where(
                and_(
                    AnnoProject.del_flag == '0',
                    AnnoProject.project_name.like(f'%{query_object.project_name}%') if query_object.project_name else True,
                    AnnoProject.project_code.like(f'%{query_object.project_code}%') if query_object.project_code else True,
                    (
                        or_(
                            SysUser.user_name.like(f'%{query_object.owner}%'),
                            SysUser.nick_name.like(f'%{query_object.owner}%'),
                        )
                        if query_object.owner
                        else True
                    ),
                    (AnnoProject.project_status == query_object.status if query_object.status else True),
                )
            )
            .order_by(AnnoProject.create_time.desc(), AnnoProject.project_id.desc())
        )
        return await PageUtil.paginate(db, query, query_object.page_num, query_object.page_size, is_page=True)

    @classmethod
    async def get_project_by_id(cls, db: AsyncSession, project_id: int):
        task_sub = (
            select(AnnoTask.project_id.label('project_id'), func.count(AnnoTaskItem.task_item_id).label('task_total'))
            .join(AnnoTaskItem, AnnoTaskItem.task_id == AnnoTask.task_id, isouter=True)
            .group_by(AnnoTask.project_id)
            .subquery()
        )
        done_sub = (
            select(AnnoTask.project_id.label('project_id'), func.count(AnnoTaskItem.task_item_id).label('completed_count'))
            .join(AnnoTaskItem, AnnoTaskItem.task_id == AnnoTask.task_id)
            .where(AnnoTaskItem.task_item_status == '4')
            .group_by(AnnoTask.project_id)
            .subquery()
        )
        query = (
            select(
                AnnoProject.project_id,
                AnnoProject.project_code,
                AnnoProject.project_name,
                SysUser.user_name.label('owner_name'),
                func.coalesce(task_sub.c.task_total, 0).label('task_total'),
                func.coalesce(done_sub.c.completed_count, 0).label('completed_count'),
                AnnoProject.project_status,
                AnnoProject.deadline,
                AnnoProject.create_time,
                AnnoProject.remark,
            )
            .join(SysUser, SysUser.user_id == AnnoProject.owner_id, isouter=True)
            .join(task_sub, task_sub.c.project_id == AnnoProject.project_id, isouter=True)
            .join(done_sub, done_sub.c.project_id == AnnoProject.project_id, isouter=True)
            .where(and_(AnnoProject.project_id == project_id, AnnoProject.del_flag == '0'))
        )
        return (await db.execute(query)).first()

    @classmethod
    async def get_user_by_owner_name(cls, db: AsyncSession, owner: str) -> SysUser | None:
        return (
            (
                await db.execute(
                    select(SysUser).where(
                        and_(SysUser.del_flag == '0', or_(SysUser.user_name == owner, SysUser.nick_name == owner))
                    )
                )
            )
            .scalars()
            .first()
        )

    @classmethod
    async def exists_project_code(cls, db: AsyncSession, project_code: str, exclude_project_id: int | None = None) -> bool:
        query = select(func.count(AnnoProject.project_id)).where(
            and_(
                AnnoProject.project_code == project_code,
                AnnoProject.del_flag == '0',
                AnnoProject.project_id != exclude_project_id if exclude_project_id else True,
            )
        )
        count = (await db.execute(query)).scalar() or 0
        return int(count) > 0

    @classmethod
    async def create_project(cls, db: AsyncSession, payload: ProjectCreateModel, owner_id: int, operator: str) -> None:
        now_time = datetime.now()
        db_obj = AnnoProject(
            project_code=payload.project_code,
            project_name=payload.project_name,
            owner_id=owner_id,
            project_status=payload.status,
            deadline=payload.deadline,
            remark=payload.remark,
            del_flag='0',
            create_by=operator,
            create_time=now_time,
            update_by=operator,
            update_time=now_time,
        )
        db.add(db_obj)
        await db.flush()

    @classmethod
    async def update_project(cls, db: AsyncSession, payload: ProjectUpdateModel, owner_id: int, operator: str) -> None:
        await db.execute(
            update(AnnoProject)
            .where(and_(AnnoProject.project_id == payload.project_id, AnnoProject.del_flag == '0'))
            .values(
                project_code=payload.project_code,
                project_name=payload.project_name,
                owner_id=owner_id,
                project_status=payload.status,
                deadline=payload.deadline,
                remark=payload.remark,
                update_by=operator,
                update_time=datetime.now(),
            )
        )

    @classmethod
    async def soft_delete_project(cls, db: AsyncSession, project_id: int, operator: str) -> None:
        await db.execute(
            update(AnnoProject)
            .where(and_(AnnoProject.project_id == project_id, AnnoProject.del_flag == '0'))
            .values(del_flag='2', update_by=operator, update_time=datetime.now())
        )
