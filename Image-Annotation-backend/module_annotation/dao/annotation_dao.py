from datetime import datetime
from typing import Any

from sqlalchemy import Select, and_, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from common.vo import PageModel
from module_admin.entity.do.user_do import SysUser
from module_annotation.entity.do.annotation_do import (
    AnnoAnnotation,
    AnnoAnnotationRevision,
    AnnoExportJob,
    AnnoImportJob,
    AnnoProject,
    AnnoProjectMember,
    AnnoTask,
    AnnoTaskConfig,
    AnnoTaskItem,
)
from module_annotation.entity.vo.annotation_vo import (
    AnnotationSubmitModel,
    ExportCreateModel,
    TaskConfigModel,
    WorkflowTaskCreateModel,
    WorkflowTaskPageQueryModel,
)
from utils.page_util import PageUtil


class AnnotationDao:
    @classmethod
    async def count_projects(cls, db: AsyncSession) -> int:
        return int(
            (
                await db.execute(
                    select(func.count(AnnoProject.project_id)).where(AnnoProject.del_flag == '0')
                )
            ).scalar()
            or 0
        )

    @classmethod
    async def count_projects_by_status(cls, db: AsyncSession, status: str) -> int:
        return int(
            (
                await db.execute(
                    select(func.count(AnnoProject.project_id)).where(
                        and_(AnnoProject.del_flag == '0', AnnoProject.project_status == status)
                    )
                )
            ).scalar()
            or 0
        )

    @classmethod
    async def count_delayed_projects(cls, db: AsyncSession, now_time: datetime) -> int:
        return int(
            (
                await db.execute(
                    select(func.count(AnnoProject.project_id)).where(
                        and_(
                            AnnoProject.del_flag == '0',
                            AnnoProject.project_status == '0',
                            AnnoProject.deadline.is_not(None),
                            AnnoProject.deadline < now_time,
                        )
                    )
                )
            ).scalar()
            or 0
        )

    @classmethod
    async def count_task_items_by_status(cls, db: AsyncSession, statuses: list[str]) -> int:
        return int(
            (
                await db.execute(
                    select(func.count(AnnoTaskItem.task_item_id)).where(AnnoTaskItem.task_item_status.in_(statuses))
                )
            ).scalar()
            or 0
        )

    @classmethod
    async def count_today_done(cls, db: AsyncSession) -> int:
        today = datetime.now().date()
        return int(
            (
                await db.execute(
                    select(func.count(AnnoTaskItem.task_item_id)).where(
                        and_(
                            AnnoTaskItem.task_item_status == '4',
                            AnnoTaskItem.finished_at.is_not(None),
                            func.date(AnnoTaskItem.finished_at) == today,
                        )
                    )
                )
            ).scalar()
            or 0
        )

    @classmethod
    async def list_workbench_tasks(cls, db: AsyncSession, user_id: int, limit: int = 5) -> list[dict[str, Any]]:
        query = (
            select(AnnoTask)
            .where(and_(AnnoTask.assignee_id == user_id, AnnoTask.task_status.in_(['0', '1', '2'])))
            .order_by(AnnoTask.due_time.is_(None), AnnoTask.due_time.asc(), desc(AnnoTask.create_time))
            .limit(limit)
        )
        result = (await db.execute(query)).scalars().all()
        return [
            {
                'id': str(item.task_id),
                'title': item.task_name,
                'priority': item.priority if item.priority in ['high', 'medium', 'low'] else 'medium',
                'dueAt': item.due_time.strftime('%Y-%m-%d %H:%M:%S') if item.due_time else None,
            }
            for item in result
        ]

    @classmethod
    async def list_recent_activities(cls, db: AsyncSession, limit: int = 5) -> list[dict[str, Any]]:
        query = (
            select(AnnoAnnotationRevision)
            .order_by(desc(AnnoAnnotationRevision.create_time), desc(AnnoAnnotationRevision.revision_id))
            .limit(limit)
        )
        result = (await db.execute(query)).scalars().all()
        return [
            {
                'id': str(item.revision_id),
                'time': item.create_time.strftime('%H:%M') if item.create_time else '--:--',
                'action': item.operation_type,
                'target': f'annotation_{item.annotation_id}',
            }
            for item in result
        ]

    @classmethod
    async def list_project_progress(cls, db: AsyncSession, limit: int = 5) -> list[dict[str, Any]]:
        total_sub = (
            select(AnnoTask.project_id.label('project_id'), func.count(AnnoTaskItem.task_item_id).label('total_count'))
            .join(AnnoTaskItem, AnnoTask.task_id == AnnoTaskItem.task_id)
            .group_by(AnnoTask.project_id)
            .subquery()
        )
        done_sub = (
            select(AnnoTask.project_id.label('project_id'), func.count(AnnoTaskItem.task_item_id).label('done_count'))
            .join(AnnoTaskItem, AnnoTask.task_id == AnnoTaskItem.task_id)
            .where(AnnoTaskItem.task_item_status == '4')
            .group_by(AnnoTask.project_id)
            .subquery()
        )
        query = (
            select(
                AnnoProject.project_id,
                AnnoProject.project_name,
                total_sub.c.total_count,
                func.coalesce(done_sub.c.done_count, 0).label('done_count'),
            )
            .join(total_sub, total_sub.c.project_id == AnnoProject.project_id, isouter=True)
            .join(done_sub, done_sub.c.project_id == AnnoProject.project_id, isouter=True)
            .where(AnnoProject.del_flag == '0')
            .order_by(desc(AnnoProject.create_time))
            .limit(limit)
        )
        rows = (await db.execute(query)).all()
        result: list[dict[str, Any]] = []
        for row in rows:
            total = int(row.total_count or 0)
            done = int(row.done_count or 0)
            progress = int((done / total) * 100) if total else 0
            result.append(
                {'projectId': str(row.project_id), 'projectName': row.project_name or '-', 'progress': min(progress, 100)}
            )
        return result

    @classmethod
    async def count_online_users(cls, db: AsyncSession) -> int:
        return int(
            (
                await db.execute(select(func.count(SysUser.user_id)).where(and_(SysUser.status == '0', SysUser.del_flag == '0')))
            ).scalar()
            or 0
        )

    @classmethod
    async def list_workflow_tasks(
        cls, db: AsyncSession, query_object: WorkflowTaskPageQueryModel, is_page: bool = True
    ) -> PageModel | list[dict[str, Any]]:
        query: Select = (
            select(AnnoTask, SysUser.user_name)
            .join(SysUser, SysUser.user_id == AnnoTask.assignee_id, isouter=True)
            .where(AnnoTask.project_id == query_object.project_id)
            .order_by(desc(AnnoTask.create_time))
        )
        page_result = await PageUtil.paginate(db, query, query_object.page_num, query_object.page_size, is_page)
        return page_result

    @classmethod
    async def get_user_by_name(cls, db: AsyncSession, user_name: str) -> SysUser | None:
        return (
            (await db.execute(select(SysUser).where(and_(SysUser.user_name == user_name, SysUser.del_flag == '0'))))
            .scalars()
            .first()
        )

    @classmethod
    async def add_workflow_task(cls, db: AsyncSession, task: WorkflowTaskCreateModel, assignee_id: int | None) -> AnnoTask:
        db_obj = AnnoTask(
            project_id=task.project_id,
            task_name=task.task_name,
            priority=task.priority,
            assignee_id=assignee_id,
            task_status='0',
            create_time=datetime.now(),
            update_time=datetime.now(),
        )
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def get_task_config_by_project(cls, db: AsyncSession, project_id: int) -> AnnoTaskConfig | None:
        task = (
            (await db.execute(select(AnnoTask).where(AnnoTask.project_id == project_id).order_by(desc(AnnoTask.create_time))))
            .scalars()
            .first()
        )
        if not task:
            return None
        return (await db.execute(select(AnnoTaskConfig).where(AnnoTaskConfig.task_id == task.task_id))).scalars().first()

    @classmethod
    async def save_task_config(cls, db: AsyncSession, config: TaskConfigModel, update_by: str) -> AnnoTaskConfig:
        task_id = config.task_id
        if not task_id:
            task = (
                (await db.execute(select(AnnoTask).where(AnnoTask.project_id == config.project_id).order_by(desc(AnnoTask.create_time))))
                .scalars()
                .first()
            )
            task_id = int(task.task_id) if task else None
        if not task_id:
            raise ValueError('未找到可配置任务')

        db_obj = (await db.execute(select(AnnoTaskConfig).where(AnnoTaskConfig.task_id == task_id))).scalars().first()
        if not db_obj:
            db_obj = AnnoTaskConfig(
                task_id=task_id,
                autosave_interval_sec=config.autosave_interval_sec,
                review_required='1' if config.review_required else '0',
                max_objects_per_image=config.max_objects_per_image,
                quality_threshold=config.quality_threshold,
                allow_skip='1' if config.allow_skip else '0',
                update_by=update_by,
                update_time=datetime.now(),
            )
            db.add(db_obj)
            await db.flush()
            return db_obj

        await db.execute(
            update(AnnoTaskConfig)
            .where(AnnoTaskConfig.task_id == task_id)
            .values(
                autosave_interval_sec=config.autosave_interval_sec,
                review_required='1' if config.review_required else '0',
                max_objects_per_image=config.max_objects_per_image,
                quality_threshold=config.quality_threshold,
                allow_skip='1' if config.allow_skip else '0',
                update_by=update_by,
                update_time=datetime.now(),
            )
        )
        await db.flush()
        return (await db.execute(select(AnnoTaskConfig).where(AnnoTaskConfig.task_id == task_id))).scalars().first()

    @classmethod
    async def add_import_job(cls, db: AsyncSession, payload: dict[str, Any]) -> AnnoImportJob:
        db_obj = AnnoImportJob(**payload)
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def add_export_job(cls, db: AsyncSession, payload: dict[str, Any]) -> AnnoExportJob:
        db_obj = AnnoExportJob(**payload)
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def get_latest_import_job(cls, db: AsyncSession, project_id: int) -> AnnoImportJob | None:
        return (
            (
                await db.execute(
                    select(AnnoImportJob)
                    .where(AnnoImportJob.project_id == project_id)
                    .order_by(desc(AnnoImportJob.started_at), desc(AnnoImportJob.import_job_id))
                )
            )
            .scalars()
            .first()
        )

    @classmethod
    async def get_latest_export_job(cls, db: AsyncSession, project_id: int) -> AnnoExportJob | None:
        return (
            (
                await db.execute(
                    select(AnnoExportJob)
                    .where(AnnoExportJob.project_id == project_id)
                    .order_by(desc(AnnoExportJob.started_at), desc(AnnoExportJob.export_job_id))
                )
            )
            .scalars()
            .first()
        )

    @classmethod
    async def get_latest_task(cls, db: AsyncSession, project_id: int) -> AnnoTask | None:
        return (
            (await db.execute(select(AnnoTask).where(AnnoTask.project_id == project_id).order_by(desc(AnnoTask.create_time))))
            .scalars()
            .first()
        )

    @classmethod
    async def count_tasks(cls, db: AsyncSession, project_id: int) -> int:
        return int((await db.execute(select(func.count(AnnoTask.task_id)).where(AnnoTask.project_id == project_id))).scalar() or 0)

    @classmethod
    async def get_annotation_by_task_item_id(cls, db: AsyncSession, task_item_id: int) -> AnnoAnnotation | None:
        return (
            (await db.execute(select(AnnoAnnotation).where(AnnoAnnotation.task_item_id == task_item_id))).scalars().first()
        )

    @classmethod
    async def get_task_item_by_id(cls, db: AsyncSession, task_item_id: int) -> AnnoTaskItem | None:
        return (await db.execute(select(AnnoTaskItem).where(AnnoTaskItem.task_item_id == task_item_id))).scalars().first()

    @classmethod
    async def get_task_by_id(cls, db: AsyncSession, task_id: int) -> AnnoTask | None:
        return (await db.execute(select(AnnoTask).where(AnnoTask.task_id == task_id))).scalars().first()

    @classmethod
    async def add_annotation(cls, db: AsyncSession, payload: dict[str, Any]) -> AnnoAnnotation:
        db_obj = AnnoAnnotation(**payload)
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def update_annotation(cls, db: AsyncSession, annotation_id: int, payload: dict[str, Any]) -> None:
        await db.execute(update(AnnoAnnotation).where(AnnoAnnotation.annotation_id == annotation_id).values(**payload))

    @classmethod
    async def add_annotation_revision(cls, db: AsyncSession, payload: dict[str, Any]) -> AnnoAnnotationRevision:
        db_obj = AnnoAnnotationRevision(**payload)
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def update_task_item_after_submit(cls, db: AsyncSession, task_item_id: int, submit: bool) -> None:
        status = '2' if submit else '1'
        values = {'task_item_status': status, 'claimed_at': datetime.now()}
        if submit:
            values['finished_at'] = datetime.now()
        await db.execute(update(AnnoTaskItem).where(AnnoTaskItem.task_item_id == task_item_id).values(**values))

    @classmethod
    async def list_annotation_revisions(
        cls, db: AsyncSession, annotation_id: int, limit: int = 50
    ) -> list[AnnoAnnotationRevision]:
        return (
            (
                await db.execute(
                    select(AnnoAnnotationRevision)
                    .where(AnnoAnnotationRevision.annotation_id == annotation_id)
                    .order_by(desc(AnnoAnnotationRevision.revision_no))
                    .limit(limit)
                )
            )
            .scalars()
            .all()
        )

    @classmethod
    async def get_project_permission(cls, db: AsyncSession, project_id: int, user_id: int) -> AnnoProjectMember | None:
        return (
            (
                await db.execute(
                    select(AnnoProjectMember).where(
                        and_(AnnoProjectMember.project_id == project_id, AnnoProjectMember.user_id == user_id)
                    )
                )
            )
            .scalars()
            .first()
        )

    @classmethod
    async def get_project_by_id(cls, db: AsyncSession, project_id: int) -> AnnoProject | None:
        return (await db.execute(select(AnnoProject).where(AnnoProject.project_id == project_id))).scalars().first()
