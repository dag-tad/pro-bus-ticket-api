import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',  // Your Next.js app
      // 'http://localhost:3000',  // For testing
      'https://pro-bus-ticket-ei1wws7vq-dag-tads-projects.vercel.app/', 
      'https://pro-bus-ticket-ei1wws7vq-dag-tads-projects.vercel.app/'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,      
    transformOptions: { 
      enableImplicitConversion: true 
    },
      forbidNonWhitelisted: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for B-Ticketing')
    .setVersion('1.0')
    .addTag('Users', 'User management')
    .addTag('Company', 'Transport company management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3001, () => {
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
