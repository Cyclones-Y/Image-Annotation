import re
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from config.env import SecondaryImageTableConfig


class ImageResourceDao:
    @classmethod
    def _safe_identifier(cls, value: str) -> str:
        if not value or not re.fullmatch(r'[A-Za-z0-9_]+', value):
            raise ValueError('invalid identifier')
        return value

    @classmethod
    def _table_and_fields(cls) -> dict[str, str]:
        table = cls._safe_identifier(SecondaryImageTableConfig.secondary_db_image_table)
        id_field = cls._safe_identifier(SecondaryImageTableConfig.secondary_db_image_id_field)
        url_field = cls._safe_identifier(SecondaryImageTableConfig.secondary_db_image_url_field)
        upload_time_field = cls._safe_identifier(SecondaryImageTableConfig.secondary_db_image_upload_time_field)
        width_field = SecondaryImageTableConfig.secondary_db_image_width_field or ''
        height_field = SecondaryImageTableConfig.secondary_db_image_height_field or ''
        if width_field:
            width_field = cls._safe_identifier(width_field)
        if height_field:
            height_field = cls._safe_identifier(height_field)
        return {
            'table': table,
            'id_field': id_field,
            'url_field': url_field,
            'upload_time_field': upload_time_field,
            'width_field': width_field,
            'height_field': height_field,
        }

    @classmethod
    async def count_images(cls, db: AsyncSession) -> int:
        tf = cls._table_and_fields()
        stmt = text(f"SELECT COUNT(1) AS total FROM `{tf['table']}`")
        result = await db.execute(stmt)
        row = result.first()
        return int(row[0]) if row else 0

    @classmethod
    async def list_images(cls, db: AsyncSession, offset: int, limit: int) -> list[dict[str, Any]]:
        tf = cls._table_and_fields()
        width_sel = f"`{tf['width_field']}` AS width" if tf['width_field'] else "NULL AS width"
        height_sel = f"`{tf['height_field']}` AS height" if tf['height_field'] else "NULL AS height"
        # 补充其他常用字段
        stmt = text(
            "SELECT "
            f"`{tf['id_field']}` AS image_id, "
            f"`{tf['url_field']}` AS image_url, "
            f"`{tf['upload_time_field']}` AS upload_time, "
            f"{width_sel}, "
            f"{height_sel}, "
            "user_id, user_name, tree_id, tree_code, tree_type, tree_part, file_name, location_gps, health_status, remarks, created_at, updated_at, capture_mode "
            f"FROM `{tf['table']}` "
            f"ORDER BY `{tf['upload_time_field']}` DESC "
            "LIMIT :limit OFFSET :offset"
        )
        result = await db.execute(stmt, {'limit': limit, 'offset': offset})
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    @classmethod
    async def get_image_by_id(cls, db: AsyncSession, image_id: int) -> dict[str, Any] | None:
        tf = cls._table_and_fields()
        width_sel = f"`{tf['width_field']}` AS width" if tf['width_field'] else "NULL AS width"
        height_sel = f"`{tf['height_field']}` AS height" if tf['height_field'] else "NULL AS height"
        
        stmt = text(
            "SELECT "
            f"`{tf['id_field']}` AS image_id, "
            f"`{tf['url_field']}` AS image_url, "
            f"`{tf['upload_time_field']}` AS upload_time, "
            f"{width_sel}, "
            f"{height_sel}, "
            "user_id, user_name, tree_id, tree_code, tree_type, tree_part, file_name, location_gps, health_status, remarks, created_at, updated_at, capture_mode "
            f"FROM `{tf['table']}` "
            f"WHERE `{tf['id_field']}` = :image_id "
            "LIMIT 1"
        )
        # 尝试先用 int 查询
        result = await db.execute(stmt, {'image_id': image_id})
        row = result.mappings().first()
        if not row:
            # 如果 int 查不到，尝试用 str 查询（应对数据库字段为 VARCHAR 的情况）
            result = await db.execute(stmt, {'image_id': str(image_id)})
            row = result.mappings().first()
        
        return dict(row) if row else None
