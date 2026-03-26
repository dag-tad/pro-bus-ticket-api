import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`🚀 Auth service is running on ${process.env.PORT}`);
  });

  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await app.close();
    process.exit(0);
  });
}
bootstrap();
