import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const excResp = exception.getResponse() as any;

    let body: any;

    if (status === HttpStatus.BAD_REQUEST && excResp.errors) {
      body = {
        success: false,
        message: excResp.message || 'Validasi gagal',
        error: {
          code: 'VALIDATION_ERROR',
          details: excResp.errors,
        },
      };
    } 
    else {
      body = {
        success: false,
        message: typeof excResp === 'string' ? excResp : excResp.message,
        error: {
          code: excResp.error || 'UNKNOWN_ERROR',
          details: null,
        },
      };
    }

    response.status(status).json({
      ...body,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}