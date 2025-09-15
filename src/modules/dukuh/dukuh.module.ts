import { Module } from '@nestjs/common';
import { DukuhService } from './dukuh.service';
import { DukuhController } from './dukuh.controller';

@Module({
  controllers: [DukuhController],
  providers: [DukuhService],
})
export class DukuhModule {}
