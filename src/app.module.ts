import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './module/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './controller/app.controller'; // Add this import

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb://${configService.get<string>('DATABASE_HOST')}:${configService.get<string>('DATABASE_PORT')}/${configService.get<string>('DATABASE_NAME')}`,
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  controllers: [AppController], // Add this line
  providers: [],
})
export class AppModule {}