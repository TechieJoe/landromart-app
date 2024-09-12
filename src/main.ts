import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';
import * as  cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser';

//dotenv.config()
async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.useStaticAssets(join(__dirname, '..'));
  app.useStaticAssets(join(__dirname, '..', 'uploads'));
  app.setBaseViewsDir( join(__dirname, '..', 'views'));
  app.setViewEngine('ejs')
  app.use(cookieParser())

  app.use(
    session({
      name: "susan",
      secret: "GodIsTheGreatest",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000
      }
    })
  )
  app.use(passport.initialize())
  app.use(passport.session())

  await app.listen(1000);
}
bootstrap();
