import { Test, TestingModule } from '@nestjs/testing';
import { PengajuanSuratService } from './pengajuan-surat.service';

describe('PengajuanSuratService', () => {
  let service: PengajuanSuratService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PengajuanSuratService],
    }).compile();

    service = module.get<PengajuanSuratService>(PengajuanSuratService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
