import { Test, TestingModule } from '@nestjs/testing';
import { RwController } from './rw.controller';
import { RwService } from './rw.service';

describe('RwController', () => {
  let controller: RwController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RwController],
      providers: [RwService],
    }).compile();

    controller = module.get<RwController>(RwController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
