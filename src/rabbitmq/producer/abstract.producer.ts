import { Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import * as amqp from 'amqplib';

export interface ProducerConfig {
  exchangeName: string;
  exchangeType: 'direct' | 'topic' | 'fanout' | 'headers';
  defaultRoutingKey?: string;
  exchangeOptions?: amqp.Options.AssertExchange;
}

export interface PublishOptions {
  routingKey?: string;
  expiration?: string | number;
  persistent?: boolean;
  headers?: Record<string, any>;
  priority?: number;
  correlationId?: string;
  replyTo?: string;
}

export abstract class AbstractProducer implements OnModuleInit {
  protected readonly logger: Logger;

  constructor(
    protected readonly rabbitMQService: RabbitMQService,
    protected readonly config: ProducerConfig,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async onModuleInit() {
    await this.setupProducer();
  }

  private async setupProducer() {
    try {
      // Assert exchange
      await this.rabbitMQService.assertExchange(
        this.config.exchangeName,
        this.config.exchangeType,
        this.config.exchangeOptions,
      );
      this.logger.log(`Exchange asserted: ${this.config.exchangeName}`);
      this.logger.log(`${this.constructor.name} initialized successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to setup producer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Publish a message to the exchange
   */
  protected async publish(
    message: any,
    options?: PublishOptions,
  ): Promise<boolean> {
    const routingKey = options?.routingKey || this.config.defaultRoutingKey;

    if (!routingKey) {
      throw new Error(
        'Routing key is required. Provide it in options or set defaultRoutingKey in config',
      );
    }

    this.logger.log(
      `Publishing message to ${this.config.exchangeName} with routing key: ${routingKey}`,
    );

    return this.rabbitMQService.publish(
      this.config.exchangeName,
      routingKey,
      message,
      {
        persistent: options?.persistent ?? true,
        expiration: options?.expiration,
        headers: options?.headers,
        priority: options?.priority,
        correlationId: options?.correlationId,
        replyTo: options?.replyTo,
      },
    );
  }

  /**
   * Publish a message to the queue
   */
  protected async sendToQueue(
    queue: string,
    message: any,
    options?: PublishOptions,
  ): Promise<boolean> {
    this.logger.debug(`Sending message to queue: ${queue}`);

    return this.rabbitMQService.sendToQueue(queue, message, {
      persistent: options?.persistent ?? true,
      expiration: options?.expiration,
      headers: options?.headers,
      priority: options?.priority,
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
    });
  }
}
