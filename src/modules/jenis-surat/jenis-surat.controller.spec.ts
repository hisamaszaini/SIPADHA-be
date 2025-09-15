import { Test, TestingModule } from '@nestjs/testing';
import { JenisSuratController } from './jenis-surat.controller';
import { JenisSuratService } from './jenis-surat.service';

describe('JenisSuratController', () => {
  let controller: JenisSuratController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JenisSuratController],
      providers: [JenisSuratService],
    }).compile();

    controller = module.get<JenisSuratController>(JenisSuratController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
