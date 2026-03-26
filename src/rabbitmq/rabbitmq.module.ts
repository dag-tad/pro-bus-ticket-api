// src/rabbitmq/rabbitmq.module.ts
import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { AuthProducer } from './producer/auth.producer';

@Global()
@Module({
  providers: [
    RabbitMQService,
    AuthProducer,
    AuthProducer,
  ],
  exports: [
    RabbitMQService,
    AuthProducer,
    AuthProducer,
  ],
})
export class RabbitMQModule {}
