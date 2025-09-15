import { Test, TestingModule } from '@nestjs/testing';
import { KartuKeluargaController } from './kartu-keluarga.controller';
import { KartuKeluargaService } from './kartu-keluarga.service';

describe('KartuKeluargaController', () => {
  let controller: KartuKeluargaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KartuKeluargaController],
      providers: [KartuKeluargaService],
    }).compile();

    controller = module.get<KartuKeluargaController>(KartuKeluargaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
