import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { user } from 'src/utils/schemas/user';
import { Order } from 'src/utils/schemas/order';
import { Notification } from 'src/utils/schemas/notification';
import { CreateOrderDto } from 'src/utils/dtos/order';

const notifications = [
  {
    _id: 'notificationId1',
    message: 'Test notification 1',
    read: false,
    createdAt: new Date('2025-01-13T21:11:23.759Z'),
    order: {
      _id: 'orderId1',
      orderId: 'order1',
      orders: [{ item: 'item1', action: 'wash', quantity: 1, total: 100 }],
      grandTotal: 100,
    },
  },
];

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<user>;
  let orderModel: Model<Order>;
  let notificationModel: Model<Notification>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
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
              sort: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(notifications),
              }),
            }),
          },
        },
      ],
    }).compile();
  
    service = module.get<UserService>(UserService);
    userModel = module.get<Model<user>>(getModelToken('user'));
    orderModel = module.get<Model<Order>>(getModelToken('Order'));
    notificationModel = module.get<Model<Notification>>(getModelToken('Notification'));
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should create an order', async () => {
    const createOrderDto: CreateOrderDto = {
      userId: 'someUserId',
      orderId: 'orderId',
      reference: 'reference',
      email: 'test@example.com',
      orders: [{ item: 'item1', action: 'wash', quantity: 1, total: 100 }],
      grandTotal: 100,
      metadata: {},
    };

    const savedOrder = { 
      _id: 'orderId1',
      orderId: 'order1',
      items: [
        { item: 'item1', action: 'wash', quantity: 1, total: 100 }
      ],
      grandTotal: 100,
    };
    
    jest.spyOn(orderModel, 'create').mockResolvedValueOnce(savedOrder as any);
    
    const result1 = await service.createOrder(createOrderDto);
    
    // Verify that the `create` method was called with the expected data
    expect(orderModel.create).toHaveBeenCalledWith(createOrderDto);
    
    // Verify the result
    expect(result1).toEqual(savedOrder);
    
    jest.spyOn(orderModel, 'create').mockResolvedValueOnce(savedOrder as any);

    const result = await service.createOrder(createOrderDto);
    expect(orderModel.create).toHaveBeenCalledWith(createOrderDto);
    expect(result).toEqual(savedOrder);
  });

  it('should fetch user notifications', async () => {
    const userId = 'someUserId';
    const notifications = [
      {
        _id: 'notificationId1',
        message: 'Test notification 1',
        read: false,
        createdAt: new Date('2025-01-13T21:11:23.759Z'),
        order: {
          _id: 'orderId1',
          orderId: 'order1',
          orders: [{ item: 'item1', action: 'wash', quantity: 1, total: 100 }],
          grandTotal: 100,
        },
      },
    ];

    const mockFind = {
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(notifications),
    };

    jest.spyOn(notificationModel, 'find').mockReturnValueOnce(mockFind as any);

    const result = await service.getUserNotifications(userId);
    expect(notificationModel.find).toHaveBeenCalledWith({ userId });
    expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual(notifications);
  });
});
