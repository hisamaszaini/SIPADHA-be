import { Test, TestingModule } from '@nestjs/testing';
import { RtService } from './rt.service';

describe('RtService', () => {
  let service: RtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RtService],
    }).compile();

    service = module.get<RtService>(RtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
