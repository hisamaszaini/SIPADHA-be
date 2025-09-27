import { NestFactory } from '@nestjs/core';
import { ImportExportService } from './import-export.service';
import { createImportWorker } from './import-excel.processor';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);

  const importExportService = appContext.get(ImportExportService);

  createImportWorker(importExportService);

  console.log('✅ Import worker started');
}

bootstrap();
