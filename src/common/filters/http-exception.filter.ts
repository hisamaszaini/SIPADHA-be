import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const excResp = exception.getResponse();

    let message: any = typeof excResp === 'string' ? excResp : (excResp as any).message || 'Error';
    let errorCode = (excResp as any)?.error || 'UNKNOWN_ERROR';
    let details = (excResp as any)?.details || null;

    // ==== TWEAK: Tangani Zod error ====
    if (Array.isArray(message) && message.every(m => m.path && m.message)) {
      // Zod issue format
      const fieldErrors: Record<string, string> = {};
      for (const err of message) {
        const field = err.path[0];
        fieldErrors[field] = err.message;
      }
      message = fieldErrors;
      errorCode = 'VALIDATION_ERROR';
      details = null;
    }

    response.status(status).json({
      success: false,
      message,
      error: {
        code: errorCode,
        details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}