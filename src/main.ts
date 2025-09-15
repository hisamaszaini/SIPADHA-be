import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as path from 'path';
import * as moduleAlias from 'module-alias';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import { cwd } from 'process';

moduleAlias.addAliases({
  '@': path.resolve(__dirname, 'src'),
  '@auth': path.resolve(__dirname, 'src/auth'),
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use('/uploads', express.static(join(cwd(), 'uploads')));
  await app.listen(3000);
  console.log('HTTP on http://localhost:3000');
}
bootstrap();