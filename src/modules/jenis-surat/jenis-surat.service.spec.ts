import { Test, TestingModule } from '@nestjs/testing';
import { JenisSuratService } from './jenis-surat.service';

describe('JenisSuratService', () => {
  let service: JenisSuratService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JenisSuratService],
    }).compile();

    service = module.get<JenisSuratService>(JenisSuratService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
