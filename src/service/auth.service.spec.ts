import { Test, TestingModule } from '@nestjs/testing';
import { authService } from './auth.service';
import { ConfigService } from '@nestjs/config';

describe('authService', () => {
  let service: authService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        authService,
        {
          provide: 'userModel',
          useValue: {}, // Mock the userModel
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'), // Mock the get method
          },
        },
      ],
    }).compile();

    service = module.get<authService>(authService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
});