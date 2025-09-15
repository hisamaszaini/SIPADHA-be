import { Module } from '@nestjs/common';
import { RwService } from './rw.service';
import { RwController } from './rw.controller';

@Module({
  controllers: [RwController],
  providers: [RwService],
})
export class RwModule {}
