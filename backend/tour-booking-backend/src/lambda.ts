import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// Thư viện giúp chạy Express app trong AWS Lambda
import serverlessExpress from '@vendia/serverless-express';
import { ValidationPipe } from '@nestjs/common';

// Mục đích: cache server giữa các lần Lambda được gọi (cold start / warm start)
let server: any;

/**
 * Hàm khởi tạo NestJS server
 * Hàm này chỉ chạy 1 lần khi Lambda cold start
 */
async function bootstrapServer() {
  // Tạo NestJS application từ AppModule
  const app = await NestFactory.create(AppModule);

  /**
   * Đăng ký Global Validation Pipe
   * Áp dụng cho toàn bộ controller
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Chỉ cho phép các field có trong DTO
      forbidNonWhitelisted: true, // Nếu gửi field thừa → throw error
      transform: true,            // Tự động convert kiểu dữ liệu (string -> number, boolean…)
    }),
  );

  // Khởi tạo app (không listen port vì chạy serverless)
  await app.init();

  // Lấy instance Express bên trong NestJS
  const expressApp = app.getHttpAdapter().getInstance();

  // Bọc Express app để chạy được trong AWS Lambda
  return serverlessExpress({ app: expressApp });
}

/**
 * Lambda handler
 * Đây là entry point mà AWS Lambda gọi
 */
export const handler = async (event: any, context: any) => {
  /**
   * Nếu server chưa tồn tại → tạo mới (cold start)
   * Nếu đã tồn tại → dùng lại (warm start)
   */
  server = server ?? (await bootstrapServer());

  // Chuyển event + context của Lambda cho Express xử lý
  return server(event, context);
};
