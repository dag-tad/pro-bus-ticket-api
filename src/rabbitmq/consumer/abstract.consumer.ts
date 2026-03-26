import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import * as amqp from 'amqplib';

export interface ConsumerConfig {
  queueName: string;
  exchangeName?: string;
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  routingKey?: string | string[];
  queueOptions?: amqp.Options.AssertQueue;
  exchangeOptions?: amqp.Options.AssertExchange;
  prefetch?: number;
  noAck?: boolean;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string
}

export interface MessageProcessor<T = any> {
  (message: T, originalMsg?: amqp.ConsumeMessage): Promise<void>;
}

export abstract class AbstractConsumer
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger: Logger;
  private isConsuming = false;

  constructor(
    protected readonly rabbitMQService: RabbitMQService,
    protected readonly config: ConsumerConfig,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async onModuleInit() {
    await this.setupConsumer();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async setupConsumer() {
    try {
      // Setup exchange if provided
      if (this.config.exchangeName && this.config.exchangeType) {
        await this.rabbitMQService.assertExchange(
          this.config.exchangeName,
          this.config.exchangeType,
          {
            durable: true,
            ...this.config.exchangeOptions,
          },
        );
        this.logger.log(`Exchange asserted: ${this.config.exchangeName}`);
      }

      // Prepare queue options with dead letter configuration
      const queueOptions = {
        durable: true,
        ...this.config.queueOptions,
        arguments: {
          ...this.config.queueOptions?.arguments,
          ...(this.config.deadLetterExchange && {
            'x-dead-letter-exchange': this.config.deadLetterExchange,
            'x-dead-letter-routing-key': this.config.deadLetterRoutingKey,
          }),
        },
      };

      // Setup queue
      await this.rabbitMQService.assertQueue(
        this.config.queueName,
        queueOptions,
      );
      this.logger.log(`Queue asserted: ${this.config.queueName}`);

      // Bind queue to exchange if provided
      if (this.config.exchangeName && this.config.routingKey) {
        const routingKeys = Array.isArray(this.config.routingKey)
          ? this.config.routingKey
          : [this.config.routingKey];

        for (const key of routingKeys) {
          await this.rabbitMQService.bindQueue(
            this.config.queueName,
            this.config.exchangeName,
            key,
          );
          this.logger.log(`Queue bound to exchange with routing key: ${key}`);
        }
      }

      // Set prefetch if specified
      if (this.config.prefetch) {
        const channel = this.rabbitMQService.getChannel();
        await channel.prefetch(this.config.prefetch);
      }

      // Start consuming
      await this.startConsuming();

      this.logger.log(`${this.constructor.name} started successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to setup consumer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async startConsuming() {
    if (this.isConsuming) {
      this.logger.warn('Consumer already running');
      return;
    }

    this.isConsuming = true;

    await this.rabbitMQService.consume(
      this.config.queueName,
      this.handleMessageWrapper.bind(this),
    );
  }

  private async handleMessageWrapper(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;

    try {
      // Parse message content
      let content: any;
      try {
        content = JSON.parse(msg.content.toString());
      } catch {
        content = msg.content.toString();
      }

      this.logger.debug(`Received message: ${JSON.stringify(content)}`);

      // Process the message
      await this.handleMessage(content, msg);

      // Acknowledge if not using noAck
      if (!this.config.noAck) {
        await this.rabbitMQService.ack(msg);
        this.logger.debug('Message acknowledged');
      }
    } catch (error) {
      this.logger.error(
        `Failed to process message: ${error.message}`,
        error.stack,
      );
      await this.handleError(error, msg);
    }
  }

  protected abstract handleMessage(
    content: any,
    originalMsg: amqp.ConsumeMessage,
  ): Promise<void>;

  protected async handleError(
    error: Error,
    msg: amqp.ConsumeMessage,
  ): Promise<void> {
    // Default error handling: nack without requeue
    if (!this.config.noAck) {
      await this.rabbitMQService.nack(msg, false);
    }
  }

  protected async cleanup(): Promise<void> {
    this.isConsuming = false;
    this.logger.log(`${this.constructor.name} stopped`);
  }
}
