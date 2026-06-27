import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import 'reflect-metadata';
import { AppModule } from './app.module';

/** 启动期校验必需环境变量，缺失直接 fail-fast，避免运行时才崩。 */
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_PASSWORD', 'WX_APP_ID', 'WX_APP_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`启动失败：缺少必需环境变量 ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  validateEnv();
  // rawBody: 微信支付回调验签需要原始请求体
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Enable CORS
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : process.env.NODE_ENV === 'production'
      ? ['https://creatorbar.cn', 'https://admin.creatorbar.cn'] // 生产兜底白名单：避免漏配 CORS_ORIGIN 时放行所有来源
      : true; // 开发放行所有来源
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted 保持关闭：前端（如 EventForm 发布流程）会附带 DTO 未声明的字段，
      // whitelist 已静默剥离它们；若改为报错会破坏现有提交链路。DTO 仍校验所有已声明字段。
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // AllExceptionsFilter 已通过 app.module 的 APP_FILTER 注册（DI 注入 LogService）

  // Serve static files from /uploads
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`CreatorOS server is running on port ${port}`);
}

bootstrap();
