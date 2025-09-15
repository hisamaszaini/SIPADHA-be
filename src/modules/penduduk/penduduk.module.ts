import { Module } from '@nestjs/common';
import { PendudukService } from './penduduk.service';
import { PendudukController } from './penduduk.controller';

@Module({
  controllers: [PendudukController],
  providers: [PendudukService],
})
export class PendudukModule {}
