import { Test, TestingModule } from '@nestjs/testing';
import { PengajuanSuratController } from './pengajuan-surat.controller';
import { PengajuanSuratService } from './pengajuan-surat.service';

describe('PengajuanSuratController', () => {
  let controller: PengajuanSuratController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PengajuanSuratController],
      providers: [PengajuanSuratService],
    }).compile();

    controller = module.get<PengajuanSuratController>(PengajuanSuratController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
