import { Module } from '@nestjs/common';
import { RtService } from './rt.service';
import { RtController } from './rt.controller';

@Module({
  controllers: [RtController],
  providers: [RtService],
})
export class RtModule {}
