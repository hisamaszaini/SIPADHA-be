import { Test, TestingModule } from '@nestjs/testing';
import { KartuKeluargaService } from './kartu-keluarga.service';

describe('KartuKeluargaService', () => {
  let service: KartuKeluargaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KartuKeluargaService],
    }).compile();

    service = module.get<KartuKeluargaService>(KartuKeluargaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
