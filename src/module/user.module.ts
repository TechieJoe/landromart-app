import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UserController } from '../controller/user.controller'; // Corrected import path
import { UserService } from '../service/user.service'; // Corrected import path
import { SessionSerializer } from '../utils/strategies/serializer'; // Corrected import path
import { Order, OrderSchema } from '../utils/schemas/order'; // Corrected import path
import { MulterModule } from '@nestjs/platform-express';
import { Notification, NotificationSchema } from '../utils/schemas/notification'; // Corrected import path
import { LocalStrategy } from '../utils/strategies/passport';
import { user, userSchema } from '../utils/schemas/user';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/profile-pictures',
    }),
    PassportModule.register({ session: true }),
    MongooseModule.forFeature([
      { name: user.name, schema: userSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  providers: [
    {
      provide: 'USER_SERVICE',
      useClass: UserService,
    },
    LocalStrategy,
    SessionSerializer,
  ],
  controllers: [UserController],
})
export class UserModule {}
