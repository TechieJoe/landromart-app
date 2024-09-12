import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UserController } from 'src/controller/user.controller';
import { UserService } from 'src/service/user.service';
import { RolesGuard } from 'src/utils/Guards/roles';
import { User, userSchema } from 'src/utils/schemas/user';
import { localStrategy } from 'src/utils/strategies/passport';
import { SessionSerializer } from 'src/utils/strategies/serializer';
import { Order, OrderSchema } from 'src/utils/schemas/order';
import { Transaction, transactionSchema } from 'src/utils/schemas/transaction';
import { Profile, ProfileSchema } from 'src/utils/schemas/profile';
import { passwordService } from 'src/service/password.service';

@Module({
    imports: [
        
        PassportModule.register({ session: true }),
        MongooseModule.forFeature
        ([
            {
                name: User.name,
                schema: userSchema
            },
            {
                name: Transaction.name,
                schema: transactionSchema
            },
            {
                name: Order.name,
                schema: OrderSchema
            },
            {
                name: Profile.name,
                schema: ProfileSchema
            }

        ]),

    ],

    providers:[


        {
            provide: 'USER_SERVICE',
            useClass: UserService
        },
        {
            provide: "PASSWORD_SERVICE",
            useClass: passwordService
        },


        localStrategy, SessionSerializer, RolesGuard
    ],

    controllers: [ UserController]
})
export class UserModule {}
