import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'userModel',
          useValue: {}, // Mock the userModel
        },
        {
          provide: 'OrderModel',
          useValue: {}, // Mock the OrderModel
        },
        {
          provide: 'NotificationModel',
          useValue: {}, // Mock the NotificationModel
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'), // Mock the get method
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
});