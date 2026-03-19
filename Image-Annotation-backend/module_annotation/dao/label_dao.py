from datetime import datetime

from sqlalchemy import Select, and_, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from common.vo import PageModel
from module_annotation.entity.do.annotation_do import (
    AnnoAnnotation,
    AnnoLabel,
    AnnoLabelMigration,
    AnnoLabelTemplate,
    AnnoLabelTemplateItem,
)
from module_annotation.entity.vo.label_vo import LabelPageQueryModel, LabelTemplateQueryModel
from utils.page_util import PageUtil


class LabelDao:
    @classmethod
    async def list_labels(
        cls, db: AsyncSession, query_object: LabelPageQueryModel, is_page: bool = True
    ) -> PageModel | list[AnnoLabel]:
        query: Select = (
            select(AnnoLabel)
            .where(and_(AnnoLabel.project_id == query_object.project_id, AnnoLabel.del_flag == '0'))
            .order_by(desc(AnnoLabel.usage_count), desc(AnnoLabel.update_time), desc(AnnoLabel.label_id))
        )
        if query_object.keyword:
            query = query.where(AnnoLabel.label_name.ilike(f'%{query_object.keyword.strip()}%'))
        if query_object.label_type:
            query = query.where(AnnoLabel.label_type == query_object.label_type)
        if query_object.label_category:
            query = query.where(AnnoLabel.label_category == query_object.label_category)
        return await PageUtil.paginate(db, query, query_object.page_num, query_object.page_size, is_page)

    @classmethod
    async def get_label_by_id(cls, db: AsyncSession, label_id: int) -> AnnoLabel | None:
        return (
            (
                await db.execute(select(AnnoLabel).where(and_(AnnoLabel.label_id == label_id, AnnoLabel.del_flag == '0')))
            )
            .scalars()
            .first()
        )

    @classmethod
    async def get_label_by_name(cls, db: AsyncSession, project_id: int, label_name: str) -> AnnoLabel | None:
        return (
            (
                await db.execute(
                    select(AnnoLabel).where(
                        and_(AnnoLabel.project_id == project_id, AnnoLabel.label_name == label_name, AnnoLabel.del_flag == '0')
                    )
                )
            )
            .scalars()
            .first()
        )

    @classmethod
    async def get_label_by_name_and_category(
        cls, db: AsyncSession, project_id: int, label_name: str, label_category: str
    ) -> AnnoLabel | None:
        return (
            (
                await db.execute(
                    select(AnnoLabel).where(
                        and_(
                            AnnoLabel.project_id == project_id,
                            AnnoLabel.label_name == label_name,
                            AnnoLabel.label_category == label_category,
                            AnnoLabel.del_flag == '0',
                        )
                    )
                )
            )
            .scalars()
            .first()
        )

    @classmethod
    async def add_label(cls, db: AsyncSession, payload: dict) -> AnnoLabel:
        db_obj = AnnoLabel(**payload)
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def update_label(cls, db: AsyncSession, label_id: int, payload: dict) -> None:
        await db.execute(update(AnnoLabel).where(AnnoLabel.label_id == label_id).values(**payload))

    @classmethod
    async def list_templates(
        cls, db: AsyncSession, query_object: LabelTemplateQueryModel, is_page: bool = True
    ) -> PageModel | list[AnnoLabelTemplate]:
        query: Select = (
            select(AnnoLabelTemplate)
            .where(
                and_(
                    AnnoLabelTemplate.project_id == query_object.project_id,
                    AnnoLabelTemplate.del_flag == '0',
                    AnnoLabelTemplate.is_latest == '1',
                )
            )
            .order_by(desc(AnnoLabelTemplate.update_time), desc(AnnoLabelTemplate.template_id))
        )
        if query_object.keyword:
            query = query.where(AnnoLabelTemplate.template_name.ilike(f'%{query_object.keyword.strip()}%'))
        if query_object.template_category:
            query = query.where(AnnoLabelTemplate.template_category == query_object.template_category)
        return await PageUtil.paginate(db, query, query_object.page_num, query_object.page_size, is_page)

    @classmethod
    async def get_template_by_id(cls, db: AsyncSession, template_id: int) -> AnnoLabelTemplate | None:
        return (
            (
                await db.execute(
                    select(AnnoLabelTemplate).where(
                        and_(AnnoLabelTemplate.template_id == template_id, AnnoLabelTemplate.del_flag == '0')
                    )
                )
            )
            .scalars()
            .first()
        )

    @classmethod
    async def get_latest_template_by_code(cls, db: AsyncSession, template_code: str) -> AnnoLabelTemplate | None:
        return (
            (
                await db.execute(
                    select(AnnoLabelTemplate)
                    .where(
                        and_(
                            AnnoLabelTemplate.template_code == template_code,
                            AnnoLabelTemplate.del_flag == '0',
                            AnnoLabelTemplate.is_latest == '1',
                        )
                    )
                    .order_by(desc(AnnoLabelTemplate.template_version), desc(AnnoLabelTemplate.template_id))
                )
            )
            .scalars()
            .first()
        )

    @classmethod
    async def set_template_history(cls, db: AsyncSession, template_code: str, update_by: str) -> None:
        await db.execute(
            update(AnnoLabelTemplate)
            .where(and_(AnnoLabelTemplate.template_code == template_code, AnnoLabelTemplate.is_latest == '1'))
            .values(is_latest='0', update_by=update_by, update_time=datetime.now())
        )

    @classmethod
    async def add_template(cls, db: AsyncSession, payload: dict) -> AnnoLabelTemplate:
        db_obj = AnnoLabelTemplate(**payload)
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def update_template(cls, db: AsyncSession, template_id: int, payload: dict) -> None:
        await db.execute(update(AnnoLabelTemplate).where(AnnoLabelTemplate.template_id == template_id).values(**payload))

    @classmethod
    async def remove_template_labels(cls, db: AsyncSession, template_id: int) -> None:
        rows = (
            (
                await db.execute(
                    select(AnnoLabelTemplateItem).where(AnnoLabelTemplateItem.template_id == template_id)
                )
            )
            .scalars()
            .all()
        )
        for row in rows:
            await db.delete(row)
        await db.flush()

    @classmethod
    async def add_template_labels(cls, db: AsyncSession, template_id: int, label_ids: list[int]) -> None:
        for index, label_id in enumerate(label_ids):
            db.add(
                AnnoLabelTemplateItem(
                    template_id=template_id,
                    label_id=label_id,
                    sort_no=index,
                    create_time=datetime.now(),
                )
            )
        await db.flush()

    @classmethod
    async def get_template_label_ids(cls, db: AsyncSession, template_id: int) -> list[int]:
        rows = (
            (
                await db.execute(
                    select(AnnoLabelTemplateItem).where(AnnoLabelTemplateItem.template_id == template_id).order_by(
                        AnnoLabelTemplateItem.sort_no.asc(), AnnoLabelTemplateItem.template_item_id.asc()
                    )
                )
            )
            .scalars()
            .all()
        )
        return [int(row.label_id) for row in rows]

    @classmethod
    async def batch_get_labels(cls, db: AsyncSession, project_id: int, label_ids: list[int]) -> list[AnnoLabel]:
        if not label_ids:
            return []
        rows = (
            (
                await db.execute(
                    select(AnnoLabel).where(
                        and_(AnnoLabel.project_id == project_id, AnnoLabel.del_flag == '0', AnnoLabel.label_id.in_(label_ids))
                    )
                )
            )
            .scalars()
            .all()
        )
        mapping = {int(item.label_id): item for item in rows}
        return [mapping[item] for item in label_ids if item in mapping]

    @classmethod
    async def count_template_versions(cls, db: AsyncSession, template_code: str) -> int:
        return int(
            (
                await db.execute(
                    select(func.count(AnnoLabelTemplate.template_id)).where(
                        and_(AnnoLabelTemplate.template_code == template_code, AnnoLabelTemplate.del_flag == '0')
                    )
                )
            ).scalar()
            or 0
        )

    @classmethod
    async def list_project_annotations(cls, db: AsyncSession, project_id: int) -> list[AnnoAnnotation]:
        return (
            (await db.execute(select(AnnoAnnotation).where(AnnoAnnotation.project_id == project_id))).scalars().all()
        )

    @classmethod
    async def update_annotation_result(cls, db: AsyncSession, annotation_id: int, result_json: dict) -> None:
        await db.execute(
            update(AnnoAnnotation)
            .where(AnnoAnnotation.annotation_id == annotation_id)
            .values(result_json=result_json, update_time=datetime.now())
        )

    @classmethod
    async def add_migration_log(cls, db: AsyncSession, payload: dict) -> AnnoLabelMigration:
        db_obj = AnnoLabelMigration(**payload)
        db.add(db_obj)
        await db.flush()
        return db_obj
