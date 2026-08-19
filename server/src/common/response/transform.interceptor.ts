import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ok } from './api-response';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const traceId = req.headers['x-trace-id'] || req.id || undefined;
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
          return { ...data, traceId: data.traceId || traceId };
        }
        return ok(data, 'ok', traceId);
      }),
    );
  }
}
