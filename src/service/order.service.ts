import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { Model } from "mongoose";
import { CreateOrderDto } from "src/utils/dtos/order";
import { Order } from "src/utils/schemas/order";
import { NotificationService } from "./notification.service";

@Injectable()
export class OrderService{

    private readonly paystackSecretKey = "sk_test_ac3ea693ba6514087a7948495cfaf5d3dcb7baf2";
    private readonly paystackBaseUrl = 'https://api.paystack.co';
  
    constructor( @Inject("NOTIFICATION_SERVICE") private notificationService: NotificationService,  @InjectModel(Order.name) private orderModel: Model<Order>){}
    

    // Order Creation
    async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
        try {
          const newOrder = await this.orderModel.create(createOrderDto);
      
          const notificationMessage = `Your order has been placed successfully`;
          const notificationMetadata = {
            orders: newOrder.orders,
            grandTotal: newOrder.grandTotal,
            status: newOrder.status,
          };
      
          await this.notificationService.createNotification(createOrderDto.userId, notificationMessage, notificationMetadata);
      
          return newOrder;
        } catch (error) {
          return error;
          //throw new HttpException('Failed to create order', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    

    // Paystack Transaction Initialization
    async initializeTransaction(createOrderDto: CreateOrderDto): Promise<any> {
      try {
        const response = await axios.post(
          'https://api.paystack.co/transaction/initialize',
          {
            email: createOrderDto.email,
            amount: createOrderDto.grandTotal * 100,
            reference: createOrderDto.reference,
            callback_url: 'https://your-app.up.railway.app/callback', // replace with your actual public Railway domain
            metadata: {
              sourceApp: 'laundromart', // or whatever unique identifier for the current app
              userId: createOrderDto.userId,
              orderId: createOrderDto.orderId,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
            },
          },
        );
    
        console.log('Paystack response:', response.data);
    
        if (response.data.status) {
          return response.data.data.authorization_url;
        } else {
          throw new HttpException('Transaction initialization failed', HttpStatus.BAD_REQUEST);
        }
      } catch (error) {
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
          throw new HttpException('Failed to verify transaction', HttpStatus.BAD_REQUEST);
        }
    }
    

    async handleWebhookEvent(event: any) {
        const reference = event.data.reference;
      
        // Update transaction status in your DB
        await this.updateTransactionStatus(reference, 'successful');
      
        // Optionally log or do more here
        console.log(`✅ Laundromart payment confirmed: ${reference}`);
    }
      
    
    // Method to update the transaction status in the database
    async updateTransactionStatus(reference: string, status: string): Promise<void> {
       await this.orderModel.updateOne({ reference }, { $set: { status } });
    }
    
    async getOrders(userId: string):Promise<Order[]> {
        const orders = await this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
        return orders;
    }
    

}