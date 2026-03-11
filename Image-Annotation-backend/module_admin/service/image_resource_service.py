from datetime import datetime, timedelta
from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from common.vo import PageModel
from module_admin.dao.image_resource_dao import ImageResourceDao
from module_admin.entity.vo.image_vo import ImageRowModel
from utils.crypto_util import CryptoUtil


class ImageResourceService:
    @classmethod
    def _build_signed_image_url(cls, request: Request, image_id: int, expires_seconds: int = 300) -> str:
        exp = int((datetime.now() + timedelta(seconds=expires_seconds)).timestamp())
        sig = CryptoUtil.encrypt(f'{image_id}:{exp}')
        base = str(request.base_url).rstrip('/')
        return f'{base}/api/images/{image_id}?sig={sig}'

    @classmethod
    async def get_images_page(
        cls, request: Request, secondary_db: AsyncSession, page: int, size: int
    ) -> PageModel[ImageRowModel]:
        page_num = max(page, 1)
        page_size = max(min(size, 200), 1)
        offset = (page_num - 1) * page_size
        total = await ImageResourceDao.count_images(secondary_db)
        items = await ImageResourceDao.list_images(secondary_db, offset=offset, limit=page_size)
        rows: list[ImageRowModel] = []
        for item in items:
            image_id = int(item.get('image_id'))
            # 兼容 MySQL 驱动可能返回的 datetime 类型
            upload_time = item.get('upload_time')
            if isinstance(upload_time, datetime):
                upload_time = upload_time.strftime('%Y-%m-%d %H:%M:%S')
            
            # 处理新增字段的日期格式化
            capture_time = item.get('capture_time')
            if isinstance(capture_time, datetime):
                capture_time = capture_time.strftime('%Y-%m-%d %H:%M:%S')
            
            created_at = item.get('created_at')
            if isinstance(created_at, datetime):
                created_at = created_at.strftime('%Y-%m-%d %H:%M:%S')
                
            updated_at = item.get('updated_at')
            if isinstance(updated_at, datetime):
                updated_at = updated_at.strftime('%Y-%m-%d %H:%M:%S')

            rows.append(
                ImageRowModel(
                    imageId=str(image_id),  # 强制转为字符串，符合前端期望
                    imageUrl=item.get('image_url') or cls._build_signed_image_url(request, image_id=image_id),
                    uploadTime=str(upload_time) if upload_time else None,
                    userId=str(item.get('user_id')) if item.get('user_id') else None,
                    userName=item.get('user_name'),
                    treeId=str(item.get('tree_id')) if item.get('tree_id') else None,
                    treeCode=item.get('tree_code'),
                    treeType=item.get('tree_type'),
                    treePart=item.get('tree_part'),
                    fileName=item.get('file_name'),
                    ossUrl=item.get('image_url'), # 显式透传
                    locationGps=item.get('location_gps'),
                    captureTime=str(capture_time) if capture_time else None,
                    healthStatus=item.get('health_status'),
                    remarks=item.get('remarks'),
                    createdAt=str(created_at) if created_at else None,
                    updatedAt=str(updated_at) if updated_at else None,
                    captureMode=item.get('capture_mode'),
                )
            )
        has_next = (offset + page_size) < total
        return PageModel[ImageRowModel](rows=rows, pageNum=page_num, pageSize=page_size, total=total, hasNext=has_next)

    @classmethod
    async def get_image_meta(cls, secondary_db: AsyncSession, image_id: int) -> dict[str, Any] | None:
        return await ImageResourceDao.get_image_by_id(secondary_db, image_id=image_id)
