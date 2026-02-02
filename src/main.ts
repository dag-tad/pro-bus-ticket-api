import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RabbitMQClient } from './util/messaging/client';

async function bootstrap() {
  await RabbitMQClient.init(process.env.RABBITMQ_URL!);

  const app = await NestFactory.create(AppModule);
      await RabbitMQClient.init(process.env.RABBITMQ_URL!);

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
