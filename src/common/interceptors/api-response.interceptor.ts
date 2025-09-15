import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    return next.handle().pipe(
      map((payload) => {
        // 1. Payload dengan pagination
        if (payload?.data && payload?.meta) {
          return {
            success: true,
            message: payload.message || 'Success',
            data:    payload.data,
            meta:    payload.meta,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }
        // 2. Payload biasa tanpa pagination
        return {
          success: true,
          message: payload?.message || 'Success',
          data:    payload?.data ?? payload,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}