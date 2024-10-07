import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as  cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser';
import { ConfigService } from '@nestjs/config';

//dotenv.config()
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

  app.use(
    session({
      name: configService.get<string>('SESSION_NAME') ,
      secret: configService.get<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: parseInt(configService.get<string>('SESSION_MAX_AGE'), 10)      }
    })
  )
  app.use(passport.initialize())
  app.use(passport.session())

  const port = configService.get<number>('PORT')
  await app.listen(port);
}
bootstrap();
