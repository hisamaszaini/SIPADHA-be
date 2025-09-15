import { Module } from '@nestjs/common';
import { JenisSuratService } from './jenis-surat.service';
import { JenisSuratController } from './jenis-surat.controller';

@Module({
  controllers: [JenisSuratController],
  providers: [JenisSuratService],
})
export class JenisSuratModule {}
