import { Module } from '@nestjs/common';
import { KartuKeluargaService } from './kartu-keluarga.service';
import { KartuKeluargaController } from './kartu-keluarga.controller';

@Module({
  controllers: [KartuKeluargaController],
  providers: [KartuKeluargaService],
})
export class KartuKeluargaModule {}
