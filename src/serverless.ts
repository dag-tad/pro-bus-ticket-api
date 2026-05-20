// src/serverless.ts
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import serverlessExpress from '@vendia/serverless-express';
import { Context, Handler } from 'aws-lambda';

let cachedServer: Handler;

async function bootstrap() {
  const expressApp = require('express')();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  
  await app.init();
  
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event: any, context: Context, callback: any) => {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(event, context, callback);
};