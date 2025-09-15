import { Test, TestingModule } from '@nestjs/testing';
import { DukuhController } from './dukuh.controller';
import { DukuhService } from './dukuh.service';

describe('DukuhController', () => {
  let controller: DukuhController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DukuhController],
      providers: [DukuhService],
    }).compile();

    controller = module.get<DukuhController>(DukuhController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
