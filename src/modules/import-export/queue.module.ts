import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'IMPORT_QUEUE',
      useFactory: () => {
        const connection = new IORedis({
          host: 'localhost',
          port: 6379,
        });
        return new Queue('import-excel', { connection });
      },
    },
  ],
  exports: ['IMPORT_QUEUE'],
})
export class QueueModule {}
