# 图片资源接口与独立图库前端

## 1. 后端接口

### 1.1 路由前缀

- 路由组：`/api/images`
- 认证：必须携带 `Authorization: Bearer <token>`（复用现有登录与 JWT 校验逻辑）

### 1.2 分页查询

`GET /api/images?page=&size=`

返回（沿用后端统一响应结构，分页字段为 `pageNum/pageSize/total/hasNext/rows`）：

```json
{
  "code": 200,
  "msg": "操作成功",
  "success": true,
  "time": "2026-03-11T00:00:00",
  "rows": [
    {
      "imageId": 1,
      "imageUrl": "http://localhost:9099/api/images/1?sig=...",
      "uploadTime": "2026-03-11T00:00:00",
      "width": 1920,
      "height": 1080
    }
  ],
  "pageNum": 1,
  "pageSize": 20,
  "total": 100,
  "hasNext": true
}
```

### 1.3 单张详情（二进制流）

`GET /api/images/:id`

- 返回：图片二进制流
- Range：支持 `Range` 断点续传（`bytes=...`）
- Content-Type：根据 URL/文件路径扩展名动态推断

## 2. 次级数据库与图片表配置（环境变量）

后端在原有数据库连接之外，新增一套“次级数据库”连接池，所有配置均通过环境变量注入（禁止硬编码表名/字段名）。

### 2.1 连接配置（`SECONDARY_DB_*`）

- `SECONDARY_DB_TYPE`：`mysql` / `postgresql`
- `SECONDARY_DB_HOST`
- `SECONDARY_DB_PORT`
- `SECONDARY_DB_USERNAME`
- `SECONDARY_DB_PASSWORD`
- `SECONDARY_DB_DATABASE`
- `SECONDARY_DB_ECHO`
- `SECONDARY_DB_MAX_OVERFLOW`
- `SECONDARY_DB_POOL_SIZE`
- `SECONDARY_DB_POOL_RECYCLE`
- `SECONDARY_DB_POOL_TIMEOUT`

### 2.2 图片表字段映射（同样走 `SECONDARY_DB_*`）

- `SECONDARY_DB_IMAGE_TABLE`
- `SECONDARY_DB_IMAGE_ID_FIELD`
- `SECONDARY_DB_IMAGE_URL_FIELD`
- `SECONDARY_DB_IMAGE_UPLOAD_TIME_FIELD`
- `SECONDARY_DB_IMAGE_WIDTH_FIELD`
- `SECONDARY_DB_IMAGE_HEIGHT_FIELD`

## 3. 独立图库前端：frontend-image-gallery

目录：`frontend-image-gallery/`

功能：

- 调用 `/api/images` 分页接口
- 虚拟滚动瀑布流（masonic）
- 点击图片预览原图
- 键盘 `←/→` 切换，`Esc` 关闭
- 请求自动携带 token（Cookie `Admin-Token`），401 自动清理 token 并跳转 `/index`

### 3.1 开发启动

```bash
cd frontend-image-gallery
npm i
npm run dev
```

默认读取 `VITE_APP_BASE_API` 作为后端前缀（开发环境默认 `/dev-api`）。

## 4. 测试

新增单元测试（pytest），覆盖图片接口的核心逻辑与鉴权行为：

```bash
cd Image-Annotation-test
uv venv .venv-test
uv pip install -r requirements.txt -p .venv-test
.venv-test\\Scripts\\python -m pytest -q test_image_api_unit.py
```

## 5. 代码位置（实际仓库映射）

由于本仓库后端为 FastAPI（Python），对应实现文件如下：

- 路由：`Image-Annotation-backend/module_admin/controller/image_controller.py`
- 服务：`Image-Annotation-backend/module_admin/service/image_resource_service.py`
- 次级数据库连接：`Image-Annotation-backend/config/secondary_database.py`、`Image-Annotation-backend/config/get_secondary_db.py`
- 次级库 DAO：`Image-Annotation-backend/module_admin/dao/image_resource_dao.py`
