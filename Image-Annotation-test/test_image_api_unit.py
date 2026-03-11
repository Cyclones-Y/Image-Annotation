import os
import sys
from datetime import datetime
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Image-Annotation-backend'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from config.get_db import get_db  # noqa: E402
from config.get_secondary_db import get_secondary_db  # noqa: E402
from module_admin.dao.image_resource_dao import ImageResourceDao  # noqa: E402
from module_admin.entity.vo.user_vo import CurrentUserModel, UserInfoModel  # noqa: E402
from module_admin.service.login_service import LoginService  # noqa: E402
from server import create_app  # noqa: E402


@pytest.fixture()
def test_app(monkeypatch: pytest.MonkeyPatch, tmp_path) -> Any:
    app = create_app()

    async def _fake_get_db():
        yield object()

    async def _fake_get_secondary_db():
        yield object()

    async def _fake_get_current_user(request, token: str, db):  # noqa: ARG001
        return CurrentUserModel(permissions=[], roles=[], user=UserInfoModel(user_id=1, user_name='test'))

    png_path = tmp_path / 'test.png'
    png_path.write_bytes(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR')

    async def _fake_count_images(db):  # noqa: ARG001
        return 1

    async def _fake_list_images(db, offset: int, limit: int):  # noqa: ARG001
        return [
            {
                'image_id': 1,
                'image_url': str(png_path),
                'upload_time': datetime.now(),
                'width': 100,
                'height': 80,
            }
        ]

    async def _fake_get_image_by_id(db, image_id: int):  # noqa: ARG001
        if image_id != 1:
            return None
        return {
            'image_id': 1,
            'image_url': str(png_path),
            'upload_time': datetime.now(),
            'width': 100,
            'height': 80,
        }

    app.dependency_overrides[get_db] = _fake_get_db
    app.dependency_overrides[get_secondary_db] = _fake_get_secondary_db
    monkeypatch.setattr(LoginService, 'get_current_user', _fake_get_current_user)
    monkeypatch.setattr(ImageResourceDao, 'count_images', _fake_count_images)
    monkeypatch.setattr(ImageResourceDao, 'list_images', _fake_list_images)
    monkeypatch.setattr(ImageResourceDao, 'get_image_by_id', _fake_get_image_by_id)
    return app


@pytest.mark.asyncio
async def test_images_page_requires_auth(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/images?page=1&size=20')
        assert res.status_code == 200
        body = res.json()
        assert body.get('code') == 401


@pytest.mark.asyncio
async def test_images_page_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/images?page=1&size=20', headers={'Authorization': 'Bearer test'})
        assert res.status_code == 200
        body = res.json()
        assert body.get('success') is True
        assert body.get('pageNum') == 1
        assert body.get('pageSize') == 20
        assert body.get('total') == 1
        assert isinstance(body.get('rows'), list)
        assert body['rows'][0]['imageId'] == 1
        assert 'api/images/1' in body['rows'][0]['imageUrl']


@pytest.mark.asyncio
async def test_image_binary_range_ok(test_app) -> None:
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url='http://test') as client:
        res = await client.get('/api/images/1', headers={'Authorization': 'Bearer test', 'Range': 'bytes=0-3'})
        assert res.status_code in (200, 206)
        assert res.headers.get('content-type', '').startswith('image/png')
