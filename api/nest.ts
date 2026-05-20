import { NestFactory } from '@nestjs/core';
import serverless from 'serverless-http';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

let cachedServer;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('API Documentation')
      .setDescription('API documentation for B-Ticketing')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document);

    await app.init();

    cachedServer = serverless(
      app.getHttpAdapter().getInstance(),
    );
  }

  return cachedServer;
}

export default async function handler(req, res) {
  const server = await bootstrap();
  return server(req, res);
}