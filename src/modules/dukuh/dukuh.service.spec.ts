import { Test, TestingModule } from '@nestjs/testing';
import { DukuhService } from './dukuh.service';

describe('DukuhService', () => {
  let service: DukuhService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DukuhService],
    }).compile();

    service = module.get<DukuhService>(DukuhService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
