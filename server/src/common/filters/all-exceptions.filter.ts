import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { LogService } from '../../modules/log/log.service';

/** 全局异常过滤器：统一响应结构、5xx 记日志+落库（后台监控）、不向客户端泄露内部细节。 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  constructor(private readonly logService: LogService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ method?: string; url?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = '服务器内部错误';
    if (exception instanceof HttpException) {
      const body = exception.getResponse() as any;
      message = body?.message ?? exception.message;
    }

    // 5xx 记录堆栈便于排障 + 落库供后台监控；非 HttpException 不把内部细节返回客户端
    if (status >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${req?.method} ${req?.url} -> ${status}`, stack);
      void this.logService.record(
        'ERROR',
        'http',
        `${req?.method} ${req?.url} -> ${status}`,
        stack,
        req?.url,
      );
    }

    res.status(status).json({ statusCode: status, message });
  }
}
