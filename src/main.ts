import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RabbitMQClient } from './util/messaging/client';
import { IUserCreated } from './util/messaging/types/user-created-type';
import { UserHandler } from './handlers/user.handler';
import { CreateUserDTO } from './dto/create-user.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const userHandler = app.get(UserHandler)

  await RabbitMQClient.init(process.env.RABBITMQ_URL!);

  await RabbitMQClient.consume<IUserCreated>(
    'user',
    'user',
    ['user.created'],
    async (message) => {
      const user = message.payload as unknown as CreateUserDTO
      userHandler.create(user)
    },
  );

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
