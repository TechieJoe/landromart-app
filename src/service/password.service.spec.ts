import { Test, TestingModule } from '@nestjs/testing';
import { passwordService } from './password.service';

describe('FService', () => {
  let service: passwordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [passwordService],
    }).compile();

    service = module.get<passwordService>(passwordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
