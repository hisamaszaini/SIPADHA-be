import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ImportExportService } from './import-export.service';

export function createImportWorker(importExportService: ImportExportService) {
  const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });

  const worker = new Worker(
    'import-excel',
    async (job: Job) => {
      const { rows } = job.data;
      const batchSize = 50;
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        try {
          await importExportService.importFromExcel(batch);
          successCount += batch.length;
        } catch (err) {
          failedCount += batch.length;
          console.error('Batch import error:', err.message);
        }

        await new Promise(resolve => setImmediate(resolve));

        const progress = Math.min(Math.round(((i + batch.length) / rows.length) * 100), 100);
        await job.updateProgress(progress);
      }

      return { successCount, failedCount, total: rows.length };
    },
    {
      connection,
      concurrency: 1,
    }
  );

  worker.on('completed', (job, result: any) => {
    console.log(
      `✅ Job ${job.id} selesai. Sukses: ${result.successCount}, Gagal: ${result.failedCount}, Total: ${result.total}`
    );
  });

  worker.on('failed', (job, err) => {
    if (job) {
      console.error(`❌ Job ${job.id} gagal:`, err.message);
    } else {
      console.error(`❌ Job gagal tapi job detail sudah tidak ada:`, err.message);
    }
  });

  return worker;
}
