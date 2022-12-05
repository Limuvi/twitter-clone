import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { BusinessErrorsInterceptor } from './common/interceptors/error.interceptor';

async function bootstrap() {
  const { PORT, COOKIE_SECRET } = process.env;
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser(COOKIE_SECRET));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new BusinessErrorsInterceptor());

  await app.listen(PORT);
  console.log(`Server is started on port ${PORT}`);
}
bootstrap();
