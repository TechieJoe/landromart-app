import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { authService } from '../service/auth.service';
import { ConfigService } from '@nestjs/config';

describe('UserController', () => {
  let controller: UserController;
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: 'USER_SERVICE',
          useClass: UserService, // Mock the UserService
        },
        {
          provide: 'AUTH_SERVICE',
          useClass: authService, // Mock the authService
        },
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

    controller = app.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});