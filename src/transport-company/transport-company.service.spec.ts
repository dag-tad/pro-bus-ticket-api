import { Test, TestingModule } from '@nestjs/testing';
import { TransportCompanyService } from './transport-company.service';

describe('TransportCompanyService', () => {
  let service: TransportCompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransportCompanyService],
    }).compile();

    service = module.get<TransportCompanyService>(TransportCompanyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
