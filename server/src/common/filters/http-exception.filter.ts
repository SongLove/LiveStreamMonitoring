import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { fail } from '../response/api-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const traceId = req.headers['x-trace-id'] || req.id;

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: number = status;
    let message = 'Internal server error';
    let data: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = status;
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        message = (obj.message as string) || message;
        if (Array.isArray(obj.message)) message = obj.message.join('; ');
        if (typeof obj.code === 'number') code = obj.code;
        data = obj.data ?? null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    res.status(status).json(fail(code, message, data, traceId));
  }
}
