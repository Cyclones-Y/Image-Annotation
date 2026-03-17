import os
import sys
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Image-Annotation-backend'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from common.vo import CrudResponseModel  # noqa: E402
from config.get_db import get_db  # noqa: E402
from module_admin.entity.vo.user_vo import CurrentUserModel, UserInfoModel  # noqa: E402
from module_admin.service.login_service import LoginService  # noqa: E402
from module_annotation.entity.vo.annotation_vo import (  # noqa: E402
    AnnotationDetailModel,
    AnnotationPermissionModel,
    AnnotationRevisionModel,
    DatasetImportJobModel,
    ExportJobModel,
    HomeDashboardModel,
    HomeSystemModel,
    TaskConfigModel,
    WorkflowSnapshotModel,
    WorkflowTaskModel,
)
from module_annotation.service.annotation_service import AnnotationService  # noqa: E402
from server import create_app  # noqa: E402


@pytest.fixture()
def test_app(monkeypatch: pytest.MonkeyPatch) -> Any:
    app = create_app()

    async def _fake_get_db():
        yield object()

    async def _fake_get_current_user(request, token: str, db):  # noqa: ARG001
        return CurrentUserModel(permissions=[], roles=[], user=UserInfoModel(user_id=1, user_name='admin'))

    async def _fake_overview(db, current_user):  # noqa: ARG001
        return HomeDashboardModel(
            overview={'totalProjects': 1, 'activeProjects': 1, 'delayedProjects': 0, 'completedProjects': 0},
            tasks={'pendingAnnotate': 1, 'annotating': 0, 'pendingReview': 0, 'reviewed': 0, 'todayDone': 0},
            workbenchTasks=[],
            activities=[],
            projectProgressTop=[],
            onlineUsers=1,
            queueBacklog=1,
            apiSuccessRate=99.9,
            avgResponseMs=50,
        )

    async def _fake_system(db):  # noqa: ARG001
        return HomeSystemModel(onlineUsers=1, queueBacklog=2, apiSuccessRate=99.9, avgResponseMs=60)

    async def _fake_list_tasks(db, query_object):  # noqa: ARG001
        from common.vo import PageModel

        return PageModel[WorkflowTaskModel](
            rows=[
                WorkflowTaskModel(
                    taskId='1',
                    projectId='1',
                    taskName='T1',
                    assignee='admin',
                    priority='high',
                    status='pending',
                    createdAt='2026-03-17 10:00:00',
                    updatedAt='2026-03-17 10:00:00',
                )
            ],
            pageNum=1,
            pageSize=20,
            total=1,
            hasNext=False,
        )

    async def _fake_create_task(db, payload):  # noqa: ARG001
        return WorkflowTaskModel(
            taskId='2',
            projectId='1',
            taskName='T2',
            assignee='admin',
            priority='medium',
            status='pending',
            createdAt='2026-03-17 10:00:00',
            updatedAt='2026-03-17 10:00:00',
        )

    async def _fake_get_config(db, project_id: int):  # noqa: ARG001
        return TaskConfigModel(projectId=project_id, taskId=1)

    async def _fake_save_config(db, payload, current_user):  # noqa: ARG001
        return payload

    async def _fake_import_job(db, payload):  # noqa: ARG001
        return DatasetImportJobModel(
            jobId='i1',
            projectId='1',
            datasetName='ds',
            totalImages=10,
            importedImages=10,
            status='done',
            startedAt='2026-03-17 10:00:00',
            finishedAt='2026-03-17 10:01:00',
        )

    async def _fake_export_job(db, payload):  # noqa: ARG001
        return ExportJobModel(
            jobId='e1',
            projectId='1',
            format='COCO',
            status='done',
            startedAt='2026-03-17 10:00:00',
            downloadUrl='/download',
        )

    async def _fake_snapshot(db, project_id: int):  # noqa: ARG001
        return WorkflowSnapshotModel(projectId='1', currentStep='annotating', taskCount=1, completionPercent=90)

    async def _fake_detail(db, task_item_id: int):  # noqa: ARG001
        return AnnotationDetailModel(
            annotationId=1,
            taskItemId=task_item_id,
            projectId=1,
            taskId=1,
            itemId=1,
            annotationStatus='0',
            currentRevisionNo=1,
            resultJson={'objects': []},
        )

    async def _fake_submit(db, payload, current_user):  # noqa: ARG001
        return CrudResponseModel(is_success=True, message='提交成功')

    async def _fake_revisions(db, annotation_id: int):  # noqa: ARG001
        return [
            AnnotationRevisionModel(
                revisionId=1,
                annotationId=annotation_id,
                revisionNo=1,
                operationType='submit',
                resultJson={},
            )
        ]

    async def _fake_permission(db, project_id: int, current_user):  # noqa: ARG001
        return AnnotationPermissionModel(
            projectId=project_id,
            userId=1,
            canAnnotate=True,
            canReview=True,
            canExport=True,
            roles=['owner'],
        )

    app.dependency_overrides[get_db] = _fake_get_db
    monkeypatch.setattr(LoginService, 'get_current_user', _fake_get_current_user)
    monkeypatch.setattr(AnnotationService, 'get_home_overview_services', _fake_overview)
    monkeypatch.setattr(AnnotationService, 'get_home_system_services', _fake_system)
    monkeypatch.setattr(AnnotationService, 'list_workflow_tasks_services', _fake_list_tasks)
    monkeypatch.setattr(AnnotationService, 'create_workflow_task_services', _fake_create_task)
    monkeypatch.setattr(AnnotationService, 'get_task_config_services', _fake_get_config)
    monkeypatch.setattr(AnnotationService, 'save_task_config_services', _fake_save_config)
    monkeypatch.setattr(AnnotationService, 'create_import_job_services', _fake_import_job)
    monkeypatch.setattr(AnnotationService, 'create_export_job_services', _fake_export_job)
    monkeypatch.setattr(AnnotationService, 'get_workflow_snapshot_services', _fake_snapshot)
    monkeypatch.setattr(AnnotationService, 'get_annotation_detail_services', _fake_detail)
    monkeypatch.setattr(AnnotationService, 'submit_annotation_services', _fake_submit)
    monkeypatch.setattr(AnnotationService, 'get_annotation_revisions_services', _fake_revisions)
    monkeypatch.setattr(AnnotationService, 'get_annotation_permission_services', _fake_permission)
    return app


@pytest.mark.asyncio
async def test_home_overview_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/home/overview', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        body = res.json()
        assert body.get('code') == 200
        assert body.get('data', {}).get('overview', {}).get('totalProjects') == 1


@pytest.mark.asyncio
async def test_home_system_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/home/system', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        body = res.json()
        assert body.get('data', {}).get('queueBacklog') == 2


@pytest.mark.asyncio
async def test_workflow_tasks_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/workflow/tasks?projectId=1&pageNum=1&pageSize=20', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        body = res.json()
        assert body.get('rows', [])[0]['taskId'] == '1'


@pytest.mark.asyncio
async def test_create_workflow_task_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.post(
            '/api/workflow/tasks',
            headers={'Authorization': 'Bearer test'},
            json={'projectId': 1, 'taskName': 'abc', 'assignee': 'admin', 'priority': 'medium'},
        )
        assert res.status_code == 200
        body = res.json()
        assert body.get('data', {}).get('taskId') == '2'


@pytest.mark.asyncio
async def test_get_task_config_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/workflow/config?projectId=1', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        assert res.json().get('data', {}).get('projectId') == 1


@pytest.mark.asyncio
async def test_save_task_config_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.post(
            '/api/workflow/config',
            headers={'Authorization': 'Bearer test'},
            json={
                'projectId': 1,
                'taskId': 1,
                'autosaveIntervalSec': 15,
                'reviewRequired': True,
                'maxObjectsPerImage': 50,
                'qualityThreshold': 0.8,
                'allowSkip': True,
            },
        )
        assert res.status_code == 200
        assert res.json().get('data', {}).get('taskId') == 1


@pytest.mark.asyncio
async def test_import_job_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.post(
            '/api/workflow/import',
            headers={'Authorization': 'Bearer test'},
            json={'projectId': 1, 'datasetName': 'ds', 'totalImages': 10},
        )
        assert res.status_code == 200
        assert res.json().get('data', {}).get('jobId') == 'i1'


@pytest.mark.asyncio
async def test_export_job_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.post(
            '/api/workflow/export',
            headers={'Authorization': 'Bearer test'},
            json={'projectId': 1, 'format': 'COCO'},
        )
        assert res.status_code == 200
        assert res.json().get('data', {}).get('jobId') == 'e1'


@pytest.mark.asyncio
async def test_workflow_snapshot_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/workflow/snapshot?projectId=1', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        assert res.json().get('data', {}).get('currentStep') == 'annotating'


@pytest.mark.asyncio
async def test_annotation_detail_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/annotation/detail?taskItemId=1', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        assert res.json().get('data', {}).get('annotationId') == 1


@pytest.mark.asyncio
async def test_annotation_submit_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.post(
            '/api/annotation/submit',
            headers={'Authorization': 'Bearer test'},
            json={'taskItemId': 1, 'resultJson': {'objects': []}, 'submit': True},
        )
        assert res.status_code == 200
        assert res.json().get('msg') == '提交成功'


@pytest.mark.asyncio
async def test_annotation_revisions_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/annotation/revisions?annotationId=1', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        assert res.json().get('data', [])[0].get('revisionId') == 1


@pytest.mark.asyncio
async def test_annotation_permissions_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/annotation/permissions?projectId=1', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        assert res.json().get('data', {}).get('canAnnotate') is True
