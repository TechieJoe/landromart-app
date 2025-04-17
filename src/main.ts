import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');
  app.use(cookieParser());

  app.use(
    session({
      name: configService.get<string>('SESSION_NAME'),
      secret: configService.get<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: parseInt(configService.get<string>('SESSION_MAX_AGE'), 10) || 3600000,
      },
    }),
  );

  app.setGlobalPrefix('laundromart-app');
  app.use(passport.initialize());
  app.use(passport.session());

  const port = process.env.PORT || configService.get<number>('PORT') || '0.0.0.0';
  const host = '0.0.0.0'; // Required for Railway & many hosting environments

  await app.listen(port, host);
  console.log(`Server is running on http://${host}:${port}/laundromart-app`);
  
  // 🧠 Memory usage logging (only logs locally in terminal)
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
    const rssMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);
    console.log(`[MEMORY USAGE] Heap: ${heapUsedMB} MB | RSS: ${rssMB} MB`);
  }, 10000); // Every 10 seconds
  
}

bootstrap();
