// src/rabbitmq/rabbitmq.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private url: string;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private readonly consumers = new Map<string, (msg: amqp.ConsumeMessage | null) => void>();

  constructor() {
    // Get URL from environment or config
    this.url = process.env.RABBITMQ_URL || "amqps://elmmmbip:Dd8P-atTw38DKbZPd2_jW51V6O-V0HL1@collie.lmq.cloudamqp.com/elmmmbip";
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.close();
  }

  async connect(url?: string): Promise<void> {
    if (url) this.url = url;
    
    if (this.isConnecting) {
      this.logger.warn('Connection already in progress');
      return;
    }

    if (this.isConnected()) {
      this.logger.log('RabbitMQ already connected');
      return;
    }

    await this.attemptConnection();
  }

  private async attemptConnection(): Promise<void> {
    this.isConnecting = true;

    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Set prefetch to 1 for fair distribution
      await this.channel.prefetch(1);
      
      // Handle connection events
      this.connection.on('close', () => {
        this.logger.error('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
        this.reconnect();
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
      });

      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.logger.log('✅ RabbitMQ connected successfully');

      // Re-establish consumers after reconnection
      await this.reestablishConsumers();

    } catch (error) {
      this.isConnecting = false;
      this.logger.error('Failed to connect to RabbitMQ', error);
      this.reconnect();
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.reconnectAttempts++;
    this.logger.warn(`Reconnecting to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.attemptConnection();
    }, this.reconnectDelay);
  }

  private isConnected(): boolean {
    return this.connection !== null && 
           this.channel !== null && 
           !this.connection.closed &&
           !this.channel.closed;
  }

  private async reestablishConsumers(): Promise<void> {
    for (const [queue, callback] of this.consumers) {
      try {
        await this.consume(queue, callback);
        this.logger.log(`Re-established consumer for queue: ${queue}`);
      } catch (error) {
        this.logger.error(`Failed to re-establish consumer for queue: ${queue}`, error);
      }
    }
  }

  async ensureConnection(maxRetries = 5, retryDelay = 2000): Promise<void> {
  if (this.isConnected()) {
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    this.logger.log(`Ensuring RabbitMQ connection (attempt ${attempt}/${maxRetries})...`);
    
    try {
      if (!this.isConnected()) {
        await this.connect();
      }
      
      // Verify channel is actually usable by checking connection status
      if (this.channel && !this.channel.closed && this.connection && !this.connection.closed) {
        // Instead of checking a queue, just verify we can access basic properties
        // This is a safer way to test channel health
        try {
          // Try to get connection server properties (doesn't require any queue)
          const serverProperties = this.connection.serverProperties;
          this.logger.log('RabbitMQ connection is healthy');
          return;
        } catch (testError) {
          this.logger.warn('Connection appears unhealthy, recreating...');
          this.channel = null;
          this.connection = null;
          await this.connect();
        }
      }
      
      if (this.isConnected()) {
        return;
      }
    } catch (error) {
      this.logger.error(`Connection attempt ${attempt} failed: ${error.message}`);
    }
    
    if (attempt < maxRetries) {
      await this.delay(retryDelay);
    }
  }
  
  throw new Error(`Failed to establish RabbitMQ connection after ${maxRetries} attempts`);
}

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async assertQueue(queue: string, options?: amqp.Options.AssertQueue): Promise<amqp.Replies.AssertQueue> {
    await this.ensureConnection();

    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel.assertQueue(queue, { durable: true, ...options });
  }

  async assertExchange(exchange: string, type: string, options?: amqp.Options.AssertExchange): Promise<amqp.Replies.AssertExchange> {
    await this.ensureConnection();
    
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel.assertExchange(exchange, type, { durable: true, ...options });
  }

  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    await this.channel.bindQueue(queue, exchange, routingKey);
  }

  async sendToQueue(queue: string, message: any, options?: amqp.Options.Publish): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const content = Buffer.from(JSON.stringify(message));
    return this.channel.sendToQueue(queue, content, {
      persistent: true,
      ...options,
    });
  }

  async publish(exchange: string, routingKey: string, message: any, options?: amqp.Options.Publish): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const content = Buffer.from(JSON.stringify(message));
    
    return this.channel.publish(exchange, routingKey, content, {
      persistent: true,
      ...options,
    });
  }

  async consume(queue: string, onMessage: (msg: amqp.ConsumeMessage | null) => void): Promise<amqp.Replies.Consume> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    // Store consumer callback for reconnection
    this.consumers.set(queue, onMessage);

    return this.channel.consume(queue, async (msg) => {
      try {
        await onMessage(msg);
      } catch (error) {
        this.logger.error(`Error processing message from queue ${queue}`, error);
        // Reject and requeue on error
        if (msg) {
          this.nack(msg, true);
        }
      }
    }, { noAck: false });
  }

  async ack(message: amqp.ConsumeMessage): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    this.channel.ack(message);
  }

  async nack(message: amqp.ConsumeMessage, requeue: boolean = false): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    this.channel.nack(message, false, requeue);
  }

  getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }

  isHealthy(): boolean {
    return this.isConnected();
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.consumers.clear();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }
}