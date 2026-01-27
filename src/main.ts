import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import crypto from 'crypto';

async function bootstrap() {
  // try {
  //   await dataSource.initialize();
  //   console.log('✅ Database connected successfully');
  // } catch (err) {
  //   console.error('❌ Database connection failed', err);
  //   process.exit(1);
  // }

  const app = await NestFactory.create(AppModule);

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
