import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UserController } from 'src/controller/user.controller';
import { UserService } from 'src/service/user.service';
import { SessionSerializer } from 'src/utils/strategies/serializer';
import { Order, OrderSchema } from 'src/utils/schemas/order';
import { MulterModule } from '@nestjs/platform-express';
import { authService } from 'src/service/auth.service';
import { Cart, CartSchema } from 'src/utils/schemas/cart';
import { Notification, NotificationSchema } from 'src/utils/schemas/notification';
import { LocalStrategy } from 'src/utils/strategies/passport';
import { user, userSchema } from 'src/utils/schemas/user';


@Module({
    imports: [

        MulterModule.register({
            dest: './uploads/profile-pictures',
        }),
        
        PassportModule.register({ session: true }),
        MongooseModule.forFeature
        ([
            {
                name: user.name,
                schema: userSchema
            },
            {
                name: Order.name,
                schema: OrderSchema
            },
            {
                name: Cart.name,
                schema: CartSchema
            },
            {
                name: Notification.name,
                schema: NotificationSchema
            }

        ]),

    ],

    providers:[


        {
            provide: 'USER_SERVICE',
            useClass: UserService
        },
        {
            provide: "AUTH_SERVICE",
            useClass: authService
        },


        LocalStrategy, SessionSerializer
    ],

    controllers: [ UserController ]
})
export class UserModule {}
