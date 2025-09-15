import { Test, TestingModule } from '@nestjs/testing';
import { PendudukService } from './penduduk.service';

describe('PendudukService', () => {
  let service: PendudukService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PendudukService],
    }).compile();

    service = module.get<PendudukService>(PendudukService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
