import { Test, TestingModule } from '@nestjs/testing';
import { SeasonalController } from './seasonal.controller';
import { SeasonalService } from './seasonal.service';

describe('SeasonalController', () => {
  let controller: SeasonalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeasonalController],
      providers: [SeasonalService],
    }).compile();

    controller = module.get<SeasonalController>(SeasonalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
