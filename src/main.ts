import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import * as connectRedis from 'connect-redis';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config(); // Load env vars from .env if running locally

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  app.use(cookieParser());

  // Redis client setup (via REDIS_URL if available)
  const redisUrl = configService.get<string>('REDIS_URL');
  const redisClient = redisUrl
    ? new Redis(redisUrl)
    : new Redis({
        host: configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(configService.get<string>('REDIS_PORT') || '6379'),
      });

  redisClient.on('error', (err) => console.error('❌ Redis error:', err));

  // Connect Redis store
  const RedisStore = connectRedis(session);
  const store = new RedisStore({
    client: redisClient,
    prefix: 'sess:',
  });

  app.use(
    session({
      store,
      name: configService.get<string>('SESSION_NAME') || 'sid',
      secret: configService.get<string>('SESSION_SECRET') || 'supersecret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: parseInt(configService.get<string>('SESSION_MAX_AGE') || '3600000'),
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.setGlobalPrefix('laundromart-app');

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  await app.listen(port, host);
  console.log(`🚀 Server is live at http://${host}:${port}/laundromart-app`);
}

bootstrap();
