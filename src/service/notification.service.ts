import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Notification } from "src/utils/schemas/notification";

@Injectable()
export class NotificationService{

    constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>){}


    async createNotification(
        userId: string,
        message: string,
        metadata?: Record<string, any>,
    ): Promise<void> {

        const notification = new this.notificationModel({
            userId,
            message,
            metadata,
        });
        await notification.save();
    }
    
    async getUserNotifications(userId: string): Promise<any> {
        try {
          const notifications = await this.notificationModel.find({ userId }).sort({ createdAt: -1 });
          return notifications;
        } catch (error) {
          console.error('Error fetching notifications:', error); // Debugging log
          throw new HttpException('Failed to fetch notifications', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    

}