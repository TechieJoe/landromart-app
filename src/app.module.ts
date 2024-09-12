import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './module/user.module';

@Module({
  imports: [
    UserModule, MongooseModule.forRoot('mongodb://127.0.0.1/user')
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
