# Swagger 接口文档

## 访问地址

启动 API 进程后：

| 资源 | URL |
|---|---|
| Swagger UI | http://localhost:4000/docs |
| OpenAPI JSON | http://localhost:4000/docs/json |

## 启动

```bash
cd server
cp .env.example .env
docker compose up -d mongo redis
npm run start:api:dev
```

## 鉴权

1. **小程序 Client**
   - 调用 `POST /api/v1/auth/login`，body: `{ "code": "wx-login-code" }`
   - 复制响应 `data.accessToken`
   - 点击 Swagger 右上角 **Authorize** → `client-jwt` → 填入 `Bearer <token>` 或直接粘贴 token

2. **管理后台 Admin**
   - 调用 `POST /api/admin/auth/login`（默认见 `.env.example` 的 bootstrap 账号）
   - 在 **Authorize** → `admin-jwt` 填入 token

勾选 **persistAuthorization** 后刷新页面仍保留 token。

## 文档说明

- 按 Tag 分组：小程序-* / 管理后台 / 微信回调 / 系统
- 请求/响应 DTO 带字段说明与示例
- 统一响应格式：`{ code, message, data, traceId }`

## 导出

```bash
curl -s http://localhost:4000/docs/json -o openapi.json
```

可用于 Postman/Apifox 导入或前端 codegen。
