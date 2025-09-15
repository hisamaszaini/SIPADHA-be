import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  exports: [UsersModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}