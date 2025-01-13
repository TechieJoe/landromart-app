import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { user } from 'src/utils/schemas/user';
import { Order } from 'src/utils/schemas/order';
import { Notification } from 'src/utils/schemas/notification';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: 'USER_SERVICE',
          useClass: UserService,
        },
        {
          provide: getModelToken('user'),
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            create: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken('Order'),
          useValue: {
            create: jest.fn(), // Add `create` method to the mock
            find: jest.fn(),
            findById: jest.fn(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
            deleteOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken('Notification'),
          useValue: {
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnThis(),
              exec: jest.fn().mockResolvedValue([]),
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>('USER_SERVICE');
  });

  it('should register a user', async () => {
    const signupDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
    };

    jest.spyOn(service, 'createUser').mockResolvedValue(signupDto as any);

    const req = {
      login: jest.fn((user, callback) => callback()),
    };
    const res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const session = {};

    await controller.signup(signupDto, req as any, res as any, session);
    expect(service.createUser).toHaveBeenCalledWith(signupDto, session);
    expect(req.login).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('home');
  });
});
