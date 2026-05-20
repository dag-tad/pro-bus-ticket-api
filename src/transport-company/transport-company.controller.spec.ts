import { Test, TestingModule } from '@nestjs/testing';
import { TransportCompanyController } from './transport-company.controller';

describe('TransportCompanyController', () => {
  let controller: TransportCompanyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportCompanyController],
    }).compile();

    controller = module.get<TransportCompanyController>(TransportCompanyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
