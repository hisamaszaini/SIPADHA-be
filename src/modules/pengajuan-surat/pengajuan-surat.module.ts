import { Module } from '@nestjs/common';
import { PengajuanSuratService } from './pengajuan-surat.service';
import { PengajuanSuratController } from './pengajuan-surat.controller';

@Module({
  controllers: [PengajuanSuratController],
  providers: [PengajuanSuratService],
})
export class PengajuanSuratModule {}
