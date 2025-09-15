import { Test, TestingModule } from '@nestjs/testing';
import { PendudukController } from './penduduk.controller';
import { PendudukService } from './penduduk.service';

describe('PendudukController', () => {
  let controller: PendudukController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PendudukController],
      providers: [PendudukService],
    }).compile();

    controller = module.get<PendudukController>(PendudukController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
