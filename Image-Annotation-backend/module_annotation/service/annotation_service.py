from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from common.enums import RedisInitKeyConfig
from common.vo import CrudResponseModel, PageModel
from exceptions.exception import ServiceException
from module_admin.entity.vo.user_vo import CurrentUserModel
from module_annotation.dao.annotation_dao import AnnotationDao
from module_annotation.entity.do.annotation_do import AnnoTaskConfig
from module_annotation.entity.vo.annotation_vo import (
    AnnotationDetailModel,
    AnnotationPermissionModel,
    AnnotationRevisionModel,
    AnnotationSubmitModel,
    DatasetImportCreateModel,
    DatasetImportJobModel,
    ExportCreateModel,
    ExportJobModel,
    HomeDashboardModel,
    HomeSystemModel,
    TaskConfigModel,
    WorkflowSnapshotModel,
    WorkflowTaskCreateModel,
    WorkflowTaskModel,
    WorkflowTaskPageQueryModel,
)


class AnnotationService:
    @classmethod
    def _datetime_to_str(cls, value: datetime | None) -> str | None:
        if not value:
            return None
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%d %H:%M:%S')
        return str(value)

    @classmethod
    def _task_status_to_front(cls, value: str | None) -> str:
        if value in ['1', '2', '3']:
            return 'in_progress'
        if value in ['4']:
            return 'completed'
        return 'pending'

    @classmethod
    def _annotation_status(cls, submit: bool) -> str:
        return '1' if submit else '0'

    @classmethod
    def _import_status_to_front(cls, value: str | None) -> str:
        if value == '1':
            return 'done'
        if value == '2':
            return 'failed'
        return 'processing'

    @classmethod
    def _export_status_to_front(cls, value: str | None) -> str:
        if value == '1':
            return 'done'
        if value == '2':
            return 'failed'
        return 'processing'

    @classmethod
    async def _count_online_users_from_redis(cls, request: Request) -> int:
        access_token_keys = await request.app.state.redis.keys(f'{RedisInitKeyConfig.ACCESS_TOKEN.key}*')
        if not access_token_keys:
            return 0
        return len(access_token_keys)

    @classmethod
    async def get_home_overview_services(
        cls, request: Request, db: AsyncSession, current_user: CurrentUserModel
    ) -> HomeDashboardModel:
        now_time = datetime.now()
        total_projects = await AnnotationDao.count_projects(db)
        active_projects = await AnnotationDao.count_projects_by_status(db, '0')
        delayed_projects = await AnnotationDao.count_delayed_projects(db, now_time)
        completed_projects = await AnnotationDao.count_projects_by_status(db, '1')

        pending_annotate = await AnnotationDao.count_task_items_by_status(db, ['0'])
        annotating = await AnnotationDao.count_task_items_by_status(db, ['1', '3'])
        pending_review = await AnnotationDao.count_task_items_by_status(db, ['2'])
        reviewed = await AnnotationDao.count_task_items_by_status(db, ['4'])
        today_done = await AnnotationDao.count_today_done(db)

        user_id = int(current_user.user.user_id) if current_user.user and current_user.user.user_id else 0
        workbench_tasks = await AnnotationDao.list_workbench_tasks(db, user_id=user_id)
        activities = await AnnotationDao.list_recent_activities(db)
        project_progress = await AnnotationDao.list_project_progress(db)
        online_users = await cls._count_online_users_from_redis(request)

        queue_backlog = pending_annotate + annotating + pending_review
        api_success_rate = 99.6
        avg_response_ms = 128

        return HomeDashboardModel(
            overview={
                'totalProjects': total_projects,
                'activeProjects': active_projects,
                'delayedProjects': delayed_projects,
                'completedProjects': completed_projects,
            },
            tasks={
                'pendingAnnotate': pending_annotate,
                'annotating': annotating,
                'pendingReview': pending_review,
                'reviewed': reviewed,
                'todayDone': today_done,
            },
            workbenchTasks=workbench_tasks,
            activities=activities,
            projectProgressTop=project_progress,
            onlineUsers=online_users,
            queueBacklog=queue_backlog,
            apiSuccessRate=api_success_rate,
            avgResponseMs=avg_response_ms,
        )

    @classmethod
    async def get_home_system_services(cls, db: AsyncSession) -> HomeSystemModel:
        online_users = await AnnotationDao.count_online_users(db)
        pending_annotate = await AnnotationDao.count_task_items_by_status(db, ['0'])
        annotating = await AnnotationDao.count_task_items_by_status(db, ['1', '2', '3'])
        queue_backlog = pending_annotate + annotating
        return HomeSystemModel(
            onlineUsers=online_users,
            queueBacklog=queue_backlog,
            apiSuccessRate=99.6,
            avgResponseMs=128,
        )

    @classmethod
    async def list_workflow_tasks_services(
        cls, db: AsyncSession, query_object: WorkflowTaskPageQueryModel
    ) -> PageModel[WorkflowTaskModel]:
        page_result = await AnnotationDao.list_workflow_tasks(db, query_object, is_page=True)
        rows = []
        for row in page_result.rows:
            rows.append(
                WorkflowTaskModel(
                    taskId=str(row.get('taskId') or ''),
                    projectId=str(row.get('projectId') or ''),
                    taskName=row.get('taskName') or '',
                    assignee=row.get('userName') or '未分配',
                    priority=(row.get('priority') or 'medium'),
                    status=cls._task_status_to_front(row.get('taskStatus')),
                    createdAt=cls._datetime_to_str(row.get('createTime')),
                    updatedAt=cls._datetime_to_str(row.get('updateTime')),
                )
            )
        return PageModel[WorkflowTaskModel](
            rows=rows,
            pageNum=page_result.page_num,
            pageSize=page_result.page_size,
            total=page_result.total,
            hasNext=page_result.has_next,
        )

    @classmethod
    async def create_workflow_task_services(
        cls, db: AsyncSession, payload: WorkflowTaskCreateModel
    ) -> WorkflowTaskModel:
        assignee_user = await AnnotationDao.get_user_by_name(db, payload.assignee)
        db_obj = await AnnotationDao.add_workflow_task(db, payload, assignee_id=assignee_user.user_id if assignee_user else None)
        await db.commit()
        return WorkflowTaskModel(
            taskId=str(db_obj.task_id),
            projectId=str(db_obj.project_id),
            taskName=db_obj.task_name,
            assignee=assignee_user.user_name if assignee_user else payload.assignee,
            priority=db_obj.priority if db_obj.priority in ['high', 'medium', 'low'] else 'medium',
            status='pending',
            createdAt=cls._datetime_to_str(db_obj.create_time),
            updatedAt=cls._datetime_to_str(db_obj.update_time),
        )

    @classmethod
    def _build_task_config_model(cls, project_id: int, config_obj: AnnoTaskConfig | None) -> TaskConfigModel:
        if not config_obj:
            return TaskConfigModel(projectId=project_id)
        quality_value = config_obj.quality_threshold
        if isinstance(quality_value, Decimal):
            quality_value = float(quality_value)
        return TaskConfigModel(
            projectId=project_id,
            taskId=int(config_obj.task_id),
            autosaveIntervalSec=int(config_obj.autosave_interval_sec or 15),
            reviewRequired=config_obj.review_required == '1',
            maxObjectsPerImage=int(config_obj.max_objects_per_image or 50),
            qualityThreshold=float(quality_value or 0.8),
            allowSkip=config_obj.allow_skip == '1',
        )

    @classmethod
    async def get_task_config_services(cls, db: AsyncSession, project_id: int) -> TaskConfigModel:
        db_obj = await AnnotationDao.get_task_config_by_project(db, project_id)
        return cls._build_task_config_model(project_id, db_obj)

    @classmethod
    async def save_task_config_services(
        cls, db: AsyncSession, payload: TaskConfigModel, current_user: CurrentUserModel
    ) -> TaskConfigModel:
        try:
            db_obj = await AnnotationDao.save_task_config(
                db,
                payload,
                update_by=current_user.user.user_name if current_user.user and current_user.user.user_name else 'system',
            )
            await db.commit()
            return cls._build_task_config_model(payload.project_id, db_obj)
        except ValueError as e:
            await db.rollback()
            raise ServiceException(message=str(e))
        except Exception as e:
            await db.rollback()
            raise e

    @classmethod
    async def create_import_job_services(cls, db: AsyncSession, payload: DatasetImportCreateModel) -> DatasetImportJobModel:
        now_time = datetime.now()
        db_obj = await AnnotationDao.add_import_job(
            db,
            {
                'project_id': payload.project_id,
                'dataset_id': None,
                'import_status': '1',
                'total_items': payload.total_images,
                'success_items': payload.total_images,
                'failed_items': 0,
                'started_at': now_time,
                'finished_at': now_time,
                'create_time': now_time,
            },
        )
        await db.commit()
        return DatasetImportJobModel(
            jobId=str(db_obj.import_job_id),
            projectId=str(payload.project_id),
            datasetName=payload.dataset_name,
            totalImages=payload.total_images,
            importedImages=payload.total_images,
            status='done',
            startedAt=cls._datetime_to_str(now_time) or '',
            finishedAt=cls._datetime_to_str(now_time),
        )

    @classmethod
    async def create_export_job_services(cls, db: AsyncSession, payload: ExportCreateModel) -> ExportJobModel:
        now_time = datetime.now()
        db_obj = await AnnotationDao.add_export_job(
            db,
            {
                'project_id': payload.project_id,
                'task_id': payload.task_id,
                'export_format': payload.format,
                'export_status': '1',
                'started_at': now_time,
                'finished_at': now_time,
            },
        )
        await db.commit()
        return ExportJobModel(
            jobId=str(db_obj.export_job_id),
            projectId=str(payload.project_id),
            format=payload.format,
            status='done',
            startedAt=cls._datetime_to_str(now_time) or '',
            downloadUrl=f'/api/workflow/export/{db_obj.export_job_id}/download',
        )

    @classmethod
    async def get_workflow_snapshot_services(cls, db: AsyncSession, project_id: int) -> WorkflowSnapshotModel:
        task_count = await AnnotationDao.count_tasks(db, project_id)
        latest_task = await AnnotationDao.get_latest_task(db, project_id)
        latest_import = await AnnotationDao.get_latest_import_job(db, project_id)
        latest_export = await AnnotationDao.get_latest_export_job(db, project_id)
        current_step = 'project_created'
        completion_percent = 20
        if task_count > 0:
            current_step = 'task_created'
            completion_percent = 40
        config = await AnnotationDao.get_task_config_by_project(db, project_id)
        if config:
            current_step = 'configured'
            completion_percent = 60
        if latest_import:
            current_step = 'dataset_imported'
            completion_percent = 75
            if latest_import.import_status == '1':
                current_step = 'annotating'
                completion_percent = 90
        if latest_export and latest_export.export_status == '1':
            current_step = 'exported'
            completion_percent = 100

        return WorkflowSnapshotModel(
            projectId=str(project_id),
            currentStep=current_step,
            taskCount=task_count,
            latestTaskName=latest_task.task_name if latest_task else None,
            latestImportStatus=cls._import_status_to_front(latest_import.import_status) if latest_import else None,
            latestExportStatus=cls._export_status_to_front(latest_export.export_status) if latest_export else None,
            completionPercent=completion_percent,
        )

    @classmethod
    async def get_annotation_detail_services(cls, db: AsyncSession, task_item_id: int) -> AnnotationDetailModel:
        task_item = await AnnotationDao.get_task_item_by_id(db, task_item_id)
        if not task_item:
            raise ServiceException(message='任务项不存在')
        task = await AnnotationDao.get_task_by_id(db, int(task_item.task_id))
        annotation = await AnnotationDao.get_annotation_by_task_item_id(db, task_item_id)
        if not annotation:
            return AnnotationDetailModel(
                annotationId=None,
                taskItemId=int(task_item.task_item_id),
                projectId=int(task.project_id) if task else 0,
                taskId=int(task_item.task_id),
                itemId=int(task_item.item_id),
                annotationStatus='0',
                currentRevisionNo=0,
                resultJson={},
            )
        return AnnotationDetailModel(
            annotationId=int(annotation.annotation_id),
            taskItemId=int(annotation.task_item_id),
            projectId=int(annotation.project_id),
            taskId=int(annotation.task_id),
            itemId=int(annotation.item_id),
            annotationStatus=annotation.annotation_status or '0',
            currentRevisionNo=int(annotation.current_revision_no or 0),
            resultJson=annotation.result_json or {},
            schemaVersion=annotation.schema_version,
            annotatorId=annotation.annotator_id,
            submittedAt=cls._datetime_to_str(annotation.submitted_at),
            updateTime=cls._datetime_to_str(annotation.update_time),
        )

    @classmethod
    async def submit_annotation_services(
        cls, db: AsyncSession, payload: AnnotationSubmitModel, current_user: CurrentUserModel
    ) -> CrudResponseModel:
        task_item = await AnnotationDao.get_task_item_by_id(db, payload.task_item_id)
        if not task_item:
            raise ServiceException(message='任务项不存在')
        task = await AnnotationDao.get_task_by_id(db, int(task_item.task_id))
        if not task:
            raise ServiceException(message='任务不存在')
        now_time = datetime.now()
        operation_type = 'submit' if payload.submit else 'save'
        annotation = await AnnotationDao.get_annotation_by_task_item_id(db, payload.task_item_id)
        if not annotation:
            annotation = await AnnotationDao.add_annotation(
                db,
                {
                    'task_item_id': int(task_item.task_item_id),
                    'project_id': int(task.project_id),
                    'task_id': int(task_item.task_id),
                    'item_id': int(task_item.item_id),
                    'current_revision_no': 1,
                    'annotation_status': cls._annotation_status(payload.submit),
                    'result_json': payload.result_json,
                    'schema_version': payload.schema_version,
                    'annotator_id': current_user.user.user_id if current_user.user else None,
                    'submitted_at': now_time if payload.submit else None,
                    'create_time': now_time,
                    'update_time': now_time,
                    'version': 0,
                },
            )
            revision_no = 1
        else:
            revision_no = int(annotation.current_revision_no or 0) + 1
            await AnnotationDao.update_annotation(
                db,
                int(annotation.annotation_id),
                {
                    'current_revision_no': revision_no,
                    'annotation_status': cls._annotation_status(payload.submit),
                    'result_json': payload.result_json,
                    'schema_version': payload.schema_version,
                    'annotator_id': current_user.user.user_id if current_user.user else None,
                    'submitted_at': now_time if payload.submit else annotation.submitted_at,
                    'update_time': now_time,
                    'version': int(annotation.version or 0) + 1,
                },
            )
        current_annotation = annotation
        if annotation and annotation.annotation_id:
            current_annotation = await AnnotationDao.get_annotation_by_task_item_id(db, payload.task_item_id)
        await AnnotationDao.add_annotation_revision(
            db,
            {
                'annotation_id': int(current_annotation.annotation_id),
                'revision_no': revision_no,
                'operation_type': operation_type,
                'result_json': payload.result_json,
                'changed_by': current_user.user.user_id if current_user.user else None,
                'change_reason': payload.change_reason,
                'create_time': now_time,
            },
        )
        await AnnotationDao.update_task_item_after_submit(db, payload.task_item_id, payload.submit)
        await db.commit()
        return CrudResponseModel(is_success=True, message='提交成功' if payload.submit else '保存成功')

    @classmethod
    async def get_annotation_revisions_services(cls, db: AsyncSession, annotation_id: int) -> list[AnnotationRevisionModel]:
        rows = await AnnotationDao.list_annotation_revisions(db, annotation_id)
        return [
            AnnotationRevisionModel(
                revisionId=int(item.revision_id),
                annotationId=int(item.annotation_id),
                revisionNo=int(item.revision_no),
                operationType=item.operation_type,
                resultJson=item.result_json or {},
                changedBy=item.changed_by,
                changeReason=item.change_reason,
                createTime=cls._datetime_to_str(item.create_time),
            )
            for item in rows
        ]

    @classmethod
    async def get_annotation_permission_services(
        cls, db: AsyncSession, project_id: int, current_user: CurrentUserModel
    ) -> AnnotationPermissionModel:
        user_id = int(current_user.user.user_id) if current_user.user and current_user.user.user_id else 0
        project = await AnnotationDao.get_project_by_id(db, project_id)
        if not project:
            raise ServiceException(message='项目不存在')
        member = await AnnotationDao.get_project_permission(db, project_id, user_id)
        is_owner = int(project.owner_id) == user_id
        can_annotate = is_owner or (member.can_annotate == '1' if member else False)
        can_review = is_owner or (member.can_review == '1' if member else False)
        can_export = is_owner or (member.can_export == '1' if member else False)
        roles = ['owner'] if is_owner else ([member.project_role] if member and member.project_role else ['viewer'])
        return AnnotationPermissionModel(
            projectId=project_id,
            userId=user_id,
            canAnnotate=can_annotate,
            canReview=can_review,
            canExport=can_export,
            roles=roles,
        )
