import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties
      forbidNonWhitelisted: true, // rejects unknown properties
      transform: true, // transforms payloads into DTO instances
    }),
  );

  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`SenTri Backend running on http://localhost:${port}/api`);
}
bootstrap();
