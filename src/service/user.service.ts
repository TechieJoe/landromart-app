import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { comparePwd, encodedPwd } from 'src/utils/bcrypt';
import { CreateOrderDto } from 'src/utils/dtos/order';
import { signupDto } from 'src/utils/dtos/signupDto';
import { User } from 'src/utils/schemas/user';
import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { Order } from 'src/utils/schemas/order';
import { Transaction } from 'src/utils/schemas/transaction';
import { Profile } from 'src/utils/schemas/profile';
import { UpdateProfileDto } from 'src/utils/dtos/profile';
import { diskStorage } from 'multer';
import { extname } from 'path';



@Injectable()
export class UserService {

  private readonly paystackSecretKey = "sk_test_ac3ea693ba6514087a7948495cfaf5d3dcb7baf2";
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  
  constructor(@InjectModel(User.name) private userModel: Model<User>, @InjectModel(Order.name) private orderModel: Model<Order>, @InjectModel(Transaction.name) private transactionModel: Model<Transaction>, @InjectModel(Profile.name) private profileModel: Model<Profile> ){}
    

    async createUser(signupDto: signupDto){
        const {name, email, password} = signupDto;
        const hash = encodedPwd(password)
        const user = await this.userModel.create({
            name,
            email,
            password: hash
        })

        console.log(user)
        return user
    }

   // async login(user: any){
    //    const payload = { username: user.name,id: user.id, role: user.role};
      //  return{
        //    access_token: this.jwtService.sign(payload)
       // }
   // }

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
    const { email, userId, orders, grandTotal } = createOrderDto;

    const newOrder = new this.orderModel(createOrderDto);
    const savedOrder = await newOrder.save();

    // Log the saved order to check if it's being saved successfully
    //console.log('Order saved successfully:', savedOrder);

    return savedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new HttpException('Failed to create order', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Paystack Transaction Initialization
async initializeTransaction(email: string, amount: number, userId: string, orderId: string): Promise<any> {
  const reference = crypto.randomBytes(16).toString('hex'); // Generate a random reference

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize', // Correct Paystack endpoint
      {
        email,
        amount: amount * 100,  // Paystack uses kobo, so multiply by 100
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
      await this.transactionModel.create({
        email,
        amount,
        reference,
        userId,
        orderId,
        status: 'pending',  // Set the status as 'pending'
      });

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

      return response.data;
    } catch (error) {
      console.error('Error verifying transaction:', error.response?.data);
      throw new HttpException('Failed to verify transaction', HttpStatus.BAD_REQUEST);
    }
  }

  // Method to update the transaction status in the database
  async updateTransactionStatus(reference: string, status: string): Promise<void> {
    await this.transactionModel.updateOne({ reference }, { status });
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

  async getProfile(userId: string): Promise<User> {
    const profile = await this.userModel.findById(userId);;
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.profileModel.findOneAndUpdate({ userId }, updateProfileDto, { new: true }).exec();
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async getOrders(userId: string):Promise<Order[]> {
    const orders = await this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return orders;
  }

  async getTransactions(userId: string): Promise<Transaction[]>{
    return await this.transactionModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }


  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneByResetToken(resetToken: string): Promise<User | undefined> {
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

}
