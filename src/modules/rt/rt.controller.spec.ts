import { Test, TestingModule } from '@nestjs/testing';
import { RtController } from './rt.controller';
import { RtService } from './rt.service';

describe('RtController', () => {
  let controller: RtController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RtController],
      providers: [RtService],
    }).compile();

    controller = module.get<RtController>(RtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
