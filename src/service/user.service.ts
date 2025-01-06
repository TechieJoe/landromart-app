import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from 'src/utils/dtos/order';
import { signupDto } from 'src/utils/dtos/signupDto';
import axios from 'axios';
import * as crypto from 'crypto';
import { UpdateProfileDto } from 'src/utils/dtos/profile';
import { diskStorage } from 'multer';
import { extname } from 'path';
//import { Cart } from 'src/utils/schemas/cart';
import { CreateCartDto } from 'src/utils/dtos/cart';
import { Notification } from 'src/utils/schemas/notification';
import { comparePwd, encodedPwd } from 'src/utils/bcrypt';
import { user } from 'src/utils/schemas/user';
import { Order } from 'src/utils/schemas/order';

@Injectable()
export class UserService {

  private readonly paystackSecretKey = "sk_test_ac3ea693ba6514087a7948495cfaf5d3dcb7baf2";
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  
  constructor(
    @InjectModel(user.name) private userModel: Model<user>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
   // @InjectModel(Cart.name) private cartModel: Model<Cart>
  ) {}
    

  async createUser(signupDto: signupDto, session: any) {
    const { name, email, password } = signupDto;
  
    // Check if the email already exists in the database
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
  
    const hash = encodedPwd(password);
    const user = await this.userModel.create({
      name,
      email,
      password: hash
    });
  
    // Store userId and email in session
    session.userId = user._id;
    session.email = user.email;
  
    console.log(user);
    return user;
  }
  
  async validate(email: string, password: string){
    // const{ email, password } = loginDto;
    const user = await this.userModel.findOne({email})
    if(user && comparePwd(password, user.password)){
      const { _id, email } = user;
      return { _id, email };
    }
      return null;
  } 

 // Order Creation
 async createOrder(createOrderDto: CreateOrderDto): Promise<any> {
  try {

    const newOrder = new this.orderModel(createOrderDto);
    const savedOrder = await newOrder.save();

    // Create a notification for the user
    const notificationMessage = `Your order with ID ${savedOrder.orderId} has been placed successfully.`;
    await this.createNotification(createOrderDto.userId, savedOrder._id, notificationMessage);

    return savedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new HttpException('Failed to create order', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Create a notification
async createNotification(userId: string, orderId: string, message: string): Promise<Notification> {
  const notification = new this.notificationModel({ user: userId, order: orderId, message });
  return notification.save();
}

// Fetch notifications for a user (with order details)
async getUserNotifications(userId: string): Promise<Notification[]> {
  return this.notificationModel
    .find({ user: userId })
    .populate('order') // Populate order details
    .sort({ createdAt: -1 })
    .exec();
}

// Mark a notification as read
async markAsRead(notificationId: string): Promise<Notification> {
  return this.notificationModel.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true },
  ).exec();
}

// Paystack Transaction Initialization
async initializeTransaction(email: string, grandTotal: number): Promise<any> {
  const reference = crypto.randomBytes(16).toString('hex'); // Generate a random reference

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize', // Correct Paystack endpoint
      {
        email,
        amount: grandTotal * 100,  // Paystack uses kobo, so multiply by 100
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
        },
      },
    );

    // Log Paystack response for debugging
    console.log('Paystack response:', response.data);

    if (response.data.status) {
      const authorizationUrl = response.data.data.authorization_url;

      // Store the transaction reference in the database for later verification
      await this.orderModel.updateOne(
        { reference },
        { $set: { reference } }  // Store the reference
      );

      // Return the authorization URL to the controller
      return authorizationUrl;
    } else {
      throw new HttpException('Transaction initialization failed', HttpStatus.BAD_REQUEST);
    }
  } catch (error) {
    console.error('Error initializing transaction:', error.response?.data || error.message);
    throw new HttpException('Failed to initialize transaction', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}  
  

  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        },
      );

      if (response.data.data.status === 'success') {
        await this.updateTransactionStatus(reference, 'successful');
      }

      return response.data;
    } catch (error) {
      console.error('Error verifying transaction:', error.response?.data);
      throw new HttpException('Failed to verify transaction', HttpStatus.BAD_REQUEST);
    }
  }

  // Method to update the transaction status in the database
  async updateTransactionStatus(reference: string, status: string): Promise<void> {
    await this.orderModel.updateOne({ reference }, { $set: { status } });
  }

  public static multerOptions = {
    storage: diskStorage({
      destination: "/app/uploads",
      filename: (req, file, cb) => {
        const fileName = `${Date.now()}${extname(file.originalname)}`;
        cb(null, fileName);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
  };

  async getProfile(userId: string): Promise<user> {
    const user = await this.userModel.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('Profile not found');
    }
    return user;
}

  async updateProfile(userId: string, UpdateProfileDto: UpdateProfileDto): Promise<user> {
    const user = await this.userModel.findOneAndUpdate({ userId }, UpdateProfileDto, { new: true }).exec();
    if (!user) {
      throw new NotFoundException('Profile not found');
    }
    return user;
  }

  async updateProfilePicture(userId: string, imageUrl: string) {
    return this.userModel.findByIdAndUpdate(userId, { profileImage: imageUrl }, {
      new: true,
    });
  }

  async getOrders(userId: string):Promise<Order[]> {
    const orders = await this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return orders;
  }

  async findOneByEmail(email: string): Promise<user | undefined> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneByResetToken(resetToken: string): Promise<user | undefined> {
    return this.userModel.findOne({ resetToken }).exec();
  }

  async updateResetToken(userId: string, resetToken: string, expiration: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      resetToken,
      resetTokenExpiration: expiration,
    }).exec();
  }

  async clearResetToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      resetToken: null,
      resetTokenExpiration: null,
    }).exec();
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }).exec();
  }
  async getall(){
    return await this.userModel.find()
  }


  async getUserById(id: string): Promise<user> {
    return await this.userModel.findById(id).exec();
  }


}
