import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ImportExportService } from './import-export.service';

export function createImportWorker(importExportService: ImportExportService) {
  const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });

  const worker = new Worker(
    'import-excel',
    async (job: Job) => {
      const { rows } = job.data;
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        try {
          await importExportService.importFromExcel([rows[i]]);
          successCount++;
        } catch (err) {
          failedCount++;
        }

        // update progress per row
        const progress = Math.round(((i + 1) / rows.length) * 100);
        await job.updateProgress(progress);
      }

      // return summary
      return { successCount, failedCount, total: rows.length };
    },
    { connection }
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
