import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** 挂载 Swagger UI：`/docs`，OpenAPI JSON：`/docs/json` */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('主播开播监控 Server API')
    .setDescription(
      [
        'NestJS 服务端接口文档（Client 小程序 + Admin 管理后台 + 微信回调）。',
        '',
        '**鉴权**',
        '- 小程序：先调 `POST /api/v1/auth/login`，将返回的 `accessToken` 填入 Authorize → `client-jwt`',
        '- 管理后台：先调 `POST /api/admin/auth/login`，将 token 填入 Authorize → `admin-jwt`',
        '',
        '**统一响应**：`{ code, message, data, traceId }`，`code=0` 表示成功。',
        '',
        '**额度规则**：推送次数仅能通过微信订阅回调发放，Client 不得直接增加额度。',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '小程序 JWT（POST /api/v1/auth/login 获取 accessToken）',
      },
      'client-jwt',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Admin JWT（POST /api/admin/auth/login 获取 accessToken）',
      },
      'admin-jwt',
    )
    .addTag('小程序-认证', '微信登录与 JWT')
    .addTag('小程序-用户', '资料与推送设置')
    .addTag('小程序-主播', '全局主播池搜索/解析')
    .addTag('小程序-订阅', '关注关系管理')
    .addTag('小程序-分类', '用户 DIY 分类')
    .addTag('小程序-额度', '推送次数账本（只读刷新）')
    .addTag('小程序-推送', '推送记录、测试、诊断、FAQ、配置')
    .addTag('小程序-直播', '历史开播会话')
    .addTag('管理后台', 'RBAC 运营接口')
    .addTag('微信回调', '服务器 URL 验证与事件推送')
    .addTag('系统', '健康检查')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'LiveStream Monitoring API',
  });
}
