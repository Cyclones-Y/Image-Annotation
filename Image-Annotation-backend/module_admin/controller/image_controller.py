import mimetypes
import os
from typing import Annotated

import httpx
from fastapi import Depends, Path, Query, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from common.aspect.pre_auth import PreAuthDependency
from common.router import APIRouterPro
from common.vo import PageResponseModel
from config.get_secondary_db import get_secondary_db
from exceptions.exception import ServiceException
from module_admin.entity.vo.image_vo import ImageRowModel
from module_admin.service.image_resource_service import ImageResourceService
from utils.log_util import logger
from utils.response_util import ResponseUtil

image_controller = APIRouterPro(prefix='/api/images', order_num=2, tags=['图片资源'], dependencies=[PreAuthDependency()])


@image_controller.get(
    '',
    summary='分页获取图片资源',
    description='用于分页获取图片资源列表',
    response_model=PageResponseModel[ImageRowModel],
)
async def get_images(
    request: Request,
    secondary_db: Annotated[AsyncSession, Depends(get_secondary_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=200)] = 20,
) -> Response:
    page_result = await ImageResourceService.get_images_page(request, secondary_db, page=page, size=size)
    logger.info('获取成功')
    return ResponseUtil.success(model_content=page_result)


@image_controller.get(
    '/{image_id}',
    summary='获取图片二进制流',
    description='用于获取单张图片二进制流，支持 Range 断点续传',
)
async def get_image_binary(
    request: Request,
    image_id: Annotated[int, Path(..., ge=1)],
    secondary_db: Annotated[AsyncSession, Depends(get_secondary_db)],
) -> Response:
    meta = await ImageResourceService.get_image_meta(secondary_db, image_id=image_id)
    if not meta:
        raise ServiceException(message='图片不存在')
    image_url = str(meta.get('image_url') or '')
    if not image_url:
        raise ServiceException(message='图片URL为空')

    url_for_mime = image_url.split('?', 1)[0]
    media_type = mimetypes.guess_type(url_for_mime)[0] or 'application/octet-stream'
    range_header = request.headers.get('range') or request.headers.get('Range')

    if image_url.startswith(('http://', 'https://')):
        headers: dict[str, str] = {}
        upstream_headers: dict[str, str] = {}
        if range_header:
            upstream_headers['Range'] = range_header
        
        # 重新实现：手动管理 client 和 response
        client = httpx.AsyncClient(follow_redirects=True, timeout=30.0)
        try:
            req = client.build_request('GET', image_url, headers=upstream_headers)
            upstream = await client.send(req, stream=True)
            
            if upstream.status_code not in (200, 206):
                await upstream.aclose()
                await client.aclose()
                logger.warning(f'远程图片获取失败 {upstream.status_code}: {image_url}')
                raise ServiceException(message='获取图片失败')

            for key in ('content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'):
                if key in upstream.headers:
                    headers[key.title()] = upstream.headers[key]

            async def _iter_bytes():
                try:
                    async for chunk in upstream.aiter_bytes():
                        yield chunk
                finally:
                    await upstream.aclose()
                    await client.aclose()

            logger.info('获取成功')
            return StreamingResponse(_iter_bytes(), status_code=upstream.status_code, media_type=media_type, headers=headers)
        except Exception as e:
            await client.aclose()
            logger.error(f'远程图片请求异常: {e}')
            raise ServiceException(message='获取图片异常')

    file_path = image_url
    if not os.path.isabs(file_path):
        file_path = os.path.abspath(file_path)
    if not os.path.exists(file_path):
        raise ServiceException(message='图片文件不存在')
    logger.info('获取成功')
    return FileResponse(path=file_path, media_type=media_type, filename=os.path.basename(file_path))
