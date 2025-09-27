import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ImportExportService } from './import-export.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

export function createImportWorker(importExportService: ImportExportService) {
  const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });

  const worker = new Worker('import-excel', async (job: Job) => {
    const { filePath } = job.data;
    if (!fs.existsSync(filePath)) throw new Error('File Excel tidak ditemukan');

    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('File Excel tidak memiliki sheet');

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    const BATCH_SIZE = 500;
    const DELAY_MS = 100;

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const batchResult = await importExportService.importFromExcel(batch);

      successCount += batchResult.successCount;
      failedCount += batchResult.failedCount;

      if (i + BATCH_SIZE < rows.length) await new Promise(r => setTimeout(r, DELAY_MS));
    }

    fs.unlinkSync(filePath);

    return { successCount, failedCount, total: rows.length };
  }, { connection });

  worker.on('completed', (job, result: any) => {
    console.log(`✅ Job ${job.id} selesai. Sukses: ${result.successCount}, Gagal: ${result.failedCount}, Total: ${result.total}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id ?? ''} gagal:`, err.message);
  });

  return worker;
}
