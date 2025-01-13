import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as  cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get<ConfigService>(ConfigService);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.useStaticAssets(join(__dirname, '..'));
  app.useStaticAssets(join(__dirname, '..', 'uploads'));
  app.setBaseViewsDir( join(__dirname, '..', 'views'));
  app.setViewEngine('ejs')
  app.use(cookieParser())

  // Apply session middleware first
  app.use(
  session({
    name: configService.get<string>('SESSION_NAME'),
    secret: configService.get<string>('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: parseInt(configService.get<string>('SESSION_MAX_AGE'), 10) || 3600000, // Default to 1 hour if not set
    }
    })
  );

  app.setGlobalPrefix('laundromart-app');
  app.use(passport.initialize());
  app.use(passport.session());

  const port = configService.get<number>('PORT')
  await app.listen(port);
}
bootstrap();
