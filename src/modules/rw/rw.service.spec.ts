import { Test, TestingModule } from '@nestjs/testing';
import { RwService } from './rw.service';

describe('RwService', () => {
  let service: RwService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RwService],
    }).compile();

    service = module.get<RwService>(RwService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
