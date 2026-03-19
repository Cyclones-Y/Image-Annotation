import copy
import html
import io
import re
import uuid
from collections import Counter
from datetime import datetime
from typing import Any

import pandas as pd
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from common.vo import CrudResponseModel, PageModel
from exceptions.exception import ServiceException
from module_admin.entity.vo.user_vo import CurrentUserModel
from module_annotation.dao.label_dao import LabelDao
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


class LabelService:
    @classmethod
    def _datetime_to_str(cls, value: datetime | None) -> str | None:
        if not value:
            return None
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%d %H:%M:%S')
        return str(value)

    @classmethod
    def _sanitize_text(cls, value: str | None, field_name: str, max_length: int) -> str:
        clean = html.escape((value or '').strip(), quote=True)
        clean = re.sub(r'\s+', ' ', clean)
        if not clean:
            raise ServiceException(message=f'{field_name}不能为空')
        if len(clean) > max_length:
            raise ServiceException(message=f'{field_name}长度不能超过{max_length}')
        return clean

    @classmethod
    def _sanitize_color(cls, value: str | None) -> str:
        color = (value or '#1677ff').strip()
        if not re.fullmatch(r'^#([0-9a-fA-F]{6})$', color):
            raise ServiceException(message='标签颜色格式不正确')
        return color.lower()

    @classmethod
    def _get_value(cls, item: Any, *keys: str, default: Any = None) -> Any:
        if isinstance(item, dict):
            for key in keys:
                if key in item:
                    return item[key]
            return default
        for key in keys:
            if hasattr(item, key):
                return getattr(item, key)
        return default

    @classmethod
    def _to_label_model(cls, item: Any) -> LabelModel:
        return LabelModel(
            labelId=int(cls._get_value(item, 'label_id', 'labelId', default=0)),
            projectId=int(cls._get_value(item, 'project_id', 'projectId', default=0)),
            labelName=str(cls._get_value(item, 'label_name', 'labelName', default='')),
            labelType=cls._get_value(item, 'label_type', 'labelType', default='object') or 'object',
            labelCategory=cls._get_value(item, 'label_category', 'labelCategory', default='default') or 'default',
            labelColor=cls._get_value(item, 'label_color', 'labelColor', default='#1677ff') or '#1677ff',
            usageCount=int(cls._get_value(item, 'usage_count', 'usageCount', default=0) or 0),
            lastUsedAt=cls._datetime_to_str(cls._get_value(item, 'last_used_at', 'lastUsedAt')),
            createTime=cls._datetime_to_str(cls._get_value(item, 'create_time', 'createTime')),
            updateTime=cls._datetime_to_str(cls._get_value(item, 'update_time', 'updateTime')),
        )

    @classmethod
    async def list_labels_services(cls, db: AsyncSession, query_object: LabelPageQueryModel) -> PageModel[LabelModel]:
        page_result = await LabelDao.list_labels(db, query_object, is_page=True)
        rows = [cls._to_label_model(item) for item in page_result.rows]
        return PageModel[LabelModel](
            rows=rows,
            pageNum=page_result.page_num,
            pageSize=page_result.page_size,
            total=page_result.total,
            hasNext=page_result.has_next,
        )

    @classmethod
    async def create_label_services(
        cls, db: AsyncSession, payload: LabelCreateModel, current_user: CurrentUserModel
    ) -> LabelModel:
        label_name = cls._sanitize_text(payload.label_name, '标签名称', 128)
        label_type = cls._sanitize_text(payload.label_type or 'object', '标签类型', 32)
        label_category = cls._sanitize_text(payload.label_category or 'default', '标签分类', 64)
        label_color = cls._sanitize_color(payload.label_color)
        existing = await LabelDao.get_label_by_name_and_category(db, payload.project_id, label_name, label_category)
        if existing:
            raise ServiceException(message='同层级下标签名称已存在')
        db_obj = await LabelDao.add_label(
            db,
            {
                'project_id': payload.project_id,
                'label_name': label_name,
                'label_type': label_type,
                'label_category': label_category,
                'label_color': label_color,
                'usage_count': 0,
                'create_by': current_user.user.user_name if current_user.user else 'system',
                'update_by': current_user.user.user_name if current_user.user else 'system',
                'create_time': datetime.now(),
                'update_time': datetime.now(),
                'del_flag': '0',
            },
        )
        await db.commit()
        return cls._to_label_model(db_obj)

    @classmethod
    async def update_label_services(
        cls, db: AsyncSession, payload: LabelUpdateModel, current_user: CurrentUserModel
    ) -> LabelModel:
        db_obj = await LabelDao.get_label_by_id(db, payload.label_id)
        if not db_obj:
            raise ServiceException(message='标签不存在')
        update_payload = {'update_time': datetime.now(), 'update_by': current_user.user.user_name if current_user.user else 'system'}
        target_name = db_obj.label_name or ''
        target_category = db_obj.label_category or 'default'
        if payload.label_name is not None:
            label_name = cls._sanitize_text(payload.label_name, '标签名称', 128)
            target_name = label_name
            update_payload['label_name'] = target_name
        if payload.label_type is not None:
            update_payload['label_type'] = cls._sanitize_text(payload.label_type, '标签类型', 32)
        if payload.label_category is not None:
            target_category = cls._sanitize_text(payload.label_category, '标签分类', 64)
            update_payload['label_category'] = target_category
        if payload.label_color is not None:
            update_payload['label_color'] = cls._sanitize_color(payload.label_color)
        existing = await LabelDao.get_label_by_name_and_category(db, int(db_obj.project_id), str(target_name), str(target_category))
        if existing and int(existing.label_id) != int(db_obj.label_id):
            raise ServiceException(message='同层级下标签名称已存在')
        await LabelDao.update_label(db, payload.label_id, update_payload)
        await db.commit()
        latest = await LabelDao.get_label_by_id(db, payload.label_id)
        return cls._to_label_model(latest)

    @classmethod
    async def delete_label_services(cls, db: AsyncSession, label_id: int, current_user: CurrentUserModel) -> CrudResponseModel:
        db_obj = await LabelDao.get_label_by_id(db, label_id)
        if not db_obj:
            raise ServiceException(message='标签不存在')
        await LabelDao.update_label(
            db,
            label_id,
            {
                'del_flag': '2',
                'update_time': datetime.now(),
                'update_by': current_user.user.user_name if current_user.user else 'system',
            },
        )
        await db.commit()
        return CrudResponseModel(is_success=True, message='标签已删除')

    @classmethod
    def _scan_file_bytes(cls, file_name: str, file_bytes: bytes) -> None:
        if len(file_bytes) > 10 * 1024 * 1024:
            raise ServiceException(message='上传文件大小不能超过10MB')
        if not file_name.lower().endswith(('.csv', '.xlsx', '.xls')):
            raise ServiceException(message='仅支持CSV或Excel格式')
        signatures = [b'EICAR-STANDARD-ANTIVIRUS-TEST-FILE', b'<script', b'AutoOpen', b'CreateObject("WScript.Shell")']
        content_head = file_bytes[:40000]
        if any(sign in content_head for sign in signatures):
            raise ServiceException(message='文件安全扫描未通过')

    @classmethod
    def _read_import_df(cls, file_name: str, file_bytes: bytes) -> pd.DataFrame:
        if file_name.lower().endswith('.csv'):
            return pd.read_csv(io.BytesIO(file_bytes))
        return pd.read_excel(io.BytesIO(file_bytes))

    @classmethod
    def _normalize_import_columns(cls, df: pd.DataFrame) -> pd.DataFrame:
        mapper = {}
        name_fields = {'标签名称', 'labelName', 'name', 'label_name'}
        category_fields = {'分类', 'labelCategory', 'category', 'label_category'}
        color_fields = {'颜色', 'labelColor', 'color', 'label_color'}
        type_fields = {'类型', 'labelType', 'type', 'label_type'}
        for col in df.columns:
            if col in name_fields:
                mapper[col] = 'label_name'
            elif col in category_fields:
                mapper[col] = 'label_category'
            elif col in color_fields:
                mapper[col] = 'label_color'
            elif col in type_fields:
                mapper[col] = 'label_type'
        converted = df.rename(columns=mapper)
        if 'label_name' not in converted.columns:
            raise ServiceException(message='导入文件缺少标签名称字段')
        if 'label_category' not in converted.columns:
            converted['label_category'] = 'default'
        if 'label_color' not in converted.columns:
            converted['label_color'] = '#1677ff'
        if 'label_type' not in converted.columns:
            converted['label_type'] = 'object'
        return converted

    @classmethod
    async def import_labels_services(
        cls, db: AsyncSession, project_id: int, file: UploadFile, current_user: CurrentUserModel
    ) -> LabelImportResultModel:
        file_bytes = await file.read()
        cls._scan_file_bytes(file.filename or '', file_bytes)
        data_frame = cls._normalize_import_columns(cls._read_import_df(file.filename or '', file_bytes))
        total_count = int(len(data_frame.index))
        success_count = 0
        failed_count = 0
        errors: list[str] = []
        for idx, row in data_frame.fillna('').iterrows():
            try:
                label_name = cls._sanitize_text(str(row.get('label_name', '')), '标签名称', 128)
                label_type = cls._sanitize_text(str(row.get('label_type', 'object')), '标签类型', 32)
                label_category = cls._sanitize_text(str(row.get('label_category', 'default')), '标签分类', 64)
                label_color = cls._sanitize_color(str(row.get('label_color', '#1677ff')))
                existing = await LabelDao.get_label_by_name_and_category(db, project_id, label_name, label_category)
                if existing:
                    await LabelDao.update_label(
                        db,
                        int(existing.label_id),
                        {
                            'label_type': label_type,
                            'label_category': label_category,
                            'label_color': label_color,
                            'update_time': datetime.now(),
                            'update_by': current_user.user.user_name if current_user.user else 'system',
                        },
                    )
                else:
                    await LabelDao.add_label(
                        db,
                        {
                            'project_id': project_id,
                            'label_name': label_name,
                            'label_type': label_type,
                            'label_category': label_category,
                            'label_color': label_color,
                            'usage_count': 0,
                            'del_flag': '0',
                            'create_by': current_user.user.user_name if current_user.user else 'system',
                            'update_by': current_user.user.user_name if current_user.user else 'system',
                            'create_time': datetime.now(),
                            'update_time': datetime.now(),
                        },
                    )
                success_count += 1
            except Exception as e:
                failed_count += 1
                errors.append(f'第{idx + 1}行：{str(e)}')
        await db.commit()
        return LabelImportResultModel(
            totalCount=total_count,
            successCount=success_count,
            failedCount=failed_count,
            errors=errors[:100],
        )

    @classmethod
    async def list_templates_services(
        cls, db: AsyncSession, query_object: LabelTemplateQueryModel
    ) -> PageModel[LabelTemplateModel]:
        page_result = await LabelDao.list_templates(db, query_object, is_page=True)
        rows = [await cls._build_template_model(db, item) for item in page_result.rows]
        return PageModel[LabelTemplateModel](
            rows=rows,
            pageNum=page_result.page_num,
            pageSize=page_result.page_size,
            total=page_result.total,
            hasNext=page_result.has_next,
        )

    @classmethod
    async def _build_template_model(cls, db: AsyncSession, template_obj: Any) -> LabelTemplateModel:
        template_id = int(cls._get_value(template_obj, 'template_id', 'templateId', default=0))
        project_id = int(cls._get_value(template_obj, 'project_id', 'projectId', default=0))
        label_ids = await LabelDao.get_template_label_ids(db, template_id)
        labels = [cls._to_label_model(item) for item in await LabelDao.batch_get_labels(db, project_id, label_ids)]
        return LabelTemplateModel(
            templateId=template_id,
            templateCode=str(cls._get_value(template_obj, 'template_code', 'templateCode', default='')),
            projectId=project_id,
            templateName=str(cls._get_value(template_obj, 'template_name', 'templateName', default='')),
            templateCategory=cls._get_value(template_obj, 'template_category', 'templateCategory', default='default') or 'default',
            templateVersion=int(cls._get_value(template_obj, 'template_version', 'templateVersion', default=1) or 1),
            visibility=cls._get_value(template_obj, 'visibility', default='project') or 'project',
            isLatest=str(cls._get_value(template_obj, 'is_latest', 'isLatest', default='1')) in {'1', 'true', 'True'},
            ownerId=cls._get_value(template_obj, 'owner_id', 'ownerId'),
            labels=labels,
            createTime=cls._datetime_to_str(cls._get_value(template_obj, 'create_time', 'createTime')),
            updateTime=cls._datetime_to_str(cls._get_value(template_obj, 'update_time', 'updateTime')),
        )

    @classmethod
    async def create_template_services(
        cls, db: AsyncSession, payload: LabelTemplateCreateModel, current_user: CurrentUserModel
    ) -> LabelTemplateModel:
        template_name = cls._sanitize_text(payload.template_name, '模板名称', 128)
        template_category = cls._sanitize_text(payload.template_category or 'default', '模板分类', 64)
        description = None
        if payload.description:
            description = cls._sanitize_text(payload.description, '模板说明', 500)
        template_code = uuid.uuid4().hex[:16]
        db_obj = await LabelDao.add_template(
            db,
            {
                'template_code': template_code,
                'project_id': payload.project_id,
                'template_name': template_name,
                'template_category': template_category,
                'template_version': 1,
                'visibility': payload.visibility,
                'is_latest': '1',
                'owner_id': current_user.user.user_id if current_user.user else None,
                'description': description,
                'create_by': current_user.user.user_name if current_user.user else 'system',
                'update_by': current_user.user.user_name if current_user.user else 'system',
                'create_time': datetime.now(),
                'update_time': datetime.now(),
                'del_flag': '0',
            },
        )
        await LabelDao.add_template_labels(db, int(db_obj.template_id), payload.label_ids)
        await db.commit()
        return await cls._build_template_model(db, db_obj)

    @classmethod
    async def update_template_services(
        cls, db: AsyncSession, payload: LabelTemplateUpdateModel, current_user: CurrentUserModel
    ) -> LabelTemplateModel:
        template_obj = await LabelDao.get_template_by_id(db, payload.template_id)
        if not template_obj:
            raise ServiceException(message='模板不存在')
        if template_obj.owner_id and current_user.user and int(template_obj.owner_id) != int(current_user.user.user_id):
            if not current_user.user.admin:
                raise ServiceException(message='仅模板创建者可编辑')
        template_code = template_obj.template_code
        template_version = await LabelDao.count_template_versions(db, template_code) + 1
        await LabelDao.set_template_history(db, template_code, current_user.user.user_name if current_user.user else 'system')
        new_obj = await LabelDao.add_template(
            db,
            {
                'template_code': template_code,
                'project_id': template_obj.project_id,
                'template_name': cls._sanitize_text(payload.template_name or template_obj.template_name, '模板名称', 128),
                'template_category': cls._sanitize_text(
                    payload.template_category or template_obj.template_category or 'default', '模板分类', 64
                ),
                'template_version': template_version,
                'visibility': payload.visibility or template_obj.visibility or 'project',
                'is_latest': '1',
                'owner_id': template_obj.owner_id,
                'description': (
                    cls._sanitize_text(payload.description, '模板说明', 500) if payload.description else template_obj.description
                ),
                'create_by': current_user.user.user_name if current_user.user else 'system',
                'update_by': current_user.user.user_name if current_user.user else 'system',
                'create_time': datetime.now(),
                'update_time': datetime.now(),
                'del_flag': '0',
            },
        )
        next_label_ids = payload.label_ids
        if next_label_ids is None:
            next_label_ids = await LabelDao.get_template_label_ids(db, int(template_obj.template_id))
        await LabelDao.add_template_labels(db, int(new_obj.template_id), next_label_ids)
        await db.commit()
        return await cls._build_template_model(db, new_obj)

    @classmethod
    async def delete_template_services(cls, db: AsyncSession, template_id: int, current_user: CurrentUserModel) -> CrudResponseModel:
        template_obj = await LabelDao.get_template_by_id(db, template_id)
        if not template_obj:
            raise ServiceException(message='模板不存在')
        if template_obj.owner_id and current_user.user and int(template_obj.owner_id) != int(current_user.user.user_id):
            if not current_user.user.admin:
                raise ServiceException(message='仅模板创建者可删除')
        await LabelDao.update_template(
            db,
            template_id,
            {
                'del_flag': '2',
                'is_latest': '0',
                'update_time': datetime.now(),
                'update_by': current_user.user.user_name if current_user.user else 'system',
            },
        )
        await db.commit()
        return CrudResponseModel(is_success=True, message='模板已删除')

    @classmethod
    def _extract_label_ids(cls, payload: Any) -> list[int]:
        ids: list[int] = []

        def walker(node: Any):
            if isinstance(node, dict):
                for key, value in node.items():
                    key_lower = str(key).lower()
                    if key_lower in {'labelid', 'label_id'} and str(value).isdigit():
                        ids.append(int(value))
                    walker(value)
            elif isinstance(node, list):
                for item in node:
                    walker(item)

        walker(payload)
        return ids

    @classmethod
    async def record_label_usage_services(cls, db: AsyncSession, project_id: int, result_json: dict) -> None:
        label_ids = cls._extract_label_ids(result_json)
        if not label_ids:
            return
        counter = Counter(label_ids)
        now_time = datetime.now()
        for label_id, count in counter.items():
            db_obj = await LabelDao.get_label_by_id(db, int(label_id))
            if not db_obj or int(db_obj.project_id) != int(project_id):
                continue
            await LabelDao.update_label(
                db,
                int(label_id),
                {
                    'usage_count': int(db_obj.usage_count or 0) + int(count),
                    'last_used_at': now_time,
                    'update_time': now_time,
                },
            )
        await db.flush()

    @classmethod
    def _migrate_label_id_in_payload(cls, payload: Any, source_label_id: int, target_label_id: int) -> tuple[Any, bool]:
        changed = False

        def walker(node: Any):
            nonlocal changed
            if isinstance(node, dict):
                for key, value in node.items():
                    key_lower = str(key).lower()
                    if key_lower in {'labelid', 'label_id'} and str(value).isdigit() and int(value) == source_label_id:
                        node[key] = target_label_id
                        changed = True
                    else:
                        walker(value)
            elif isinstance(node, list):
                for item in node:
                    walker(item)

        walker(payload)
        return payload, changed

    @classmethod
    async def preview_migration_services(
        cls, db: AsyncSession, payload: LabelMigrationPreviewModel
    ) -> LabelMigrationPreviewModel:
        annotations = await LabelDao.list_project_annotations(db, payload.project_id)
        affected = 0
        for item in annotations:
            _, changed = cls._migrate_label_id_in_payload(
                payload=copy.deepcopy(item.result_json),
                source_label_id=payload.source_label_id,
                target_label_id=payload.target_label_id,
            )
            if changed:
                affected += 1
        return LabelMigrationPreviewModel(
            projectId=payload.project_id,
            sourceLabelId=payload.source_label_id,
            targetLabelId=payload.target_label_id,
            affectedAnnotations=affected,
        )

    @classmethod
    async def apply_migration_services(
        cls, db: AsyncSession, payload: LabelMigrationApplyModel, current_user: CurrentUserModel
    ) -> LabelMigrationResultModel:
        source_label = await LabelDao.get_label_by_id(db, payload.source_label_id)
        target_label = await LabelDao.get_label_by_id(db, payload.target_label_id)
        if not source_label or not target_label:
            raise ServiceException(message='源标签或目标标签不存在')
        if int(source_label.project_id) != int(payload.project_id) or int(target_label.project_id) != int(payload.project_id):
            raise ServiceException(message='标签与项目不匹配')
        annotations = await LabelDao.list_project_annotations(db, payload.project_id)
        affected = 0
        for item in annotations:
            next_payload, changed = cls._migrate_label_id_in_payload(
                payload=copy.deepcopy(item.result_json),
                source_label_id=payload.source_label_id,
                target_label_id=payload.target_label_id,
            )
            if not changed:
                continue
            await LabelDao.update_annotation_result(db, int(item.annotation_id), next_payload)
            affected += 1
        await LabelDao.add_migration_log(
            db,
            {
                'project_id': payload.project_id,
                'source_label_id': payload.source_label_id,
                'target_label_id': payload.target_label_id,
                'affected_annotations': affected,
                'migrate_reason': payload.migrate_reason,
                'create_by': current_user.user.user_name if current_user.user else 'system',
                'create_time': datetime.now(),
            },
        )
        await db.commit()
        return LabelMigrationResultModel(affectedAnnotations=affected, migratedAt=datetime.now())
