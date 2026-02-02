import amqp, {
  Channel,
  Connection,
  ConsumeMessage,
} from 'amqplib';
import { MessageEnvelope } from './message-envelop';

type ConsumeHandler<T> = (
  message: MessageEnvelope<T>,
  raw: ConsumeMessage,
  channel: Channel,
) => Promise<void>;

export class RabbitMQClient {
  private static connection: Connection | null = null;
  private static channel: Channel | null = null;

  static async init(url: string): Promise<void> {
    if (!this.connection || !this.channel) {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.channel.prefetch(1);
    }
  }

  // -----------------------------
  // PRODUCER → QUEUE
  // -----------------------------
  static async sendToQueue<T extends object>(
    queue: string,
    envelope: MessageEnvelope<T>,
  ): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ not initialized');

    await this.channel.assertQueue(queue, { durable: true });

    this.channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(envelope)),
      { persistent: true },
    );
  }

  // -----------------------------
  // PRODUCER → EXCHANGE
  // -----------------------------
  static async publish<T extends object>(
    exchange: string,
    routingKey: string,
    envelope: MessageEnvelope<T>,
    type: 'topic' | 'direct' | 'fanout' = 'topic',
  ): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ not initialized');

    await this.channel.assertExchange(exchange, type, { durable: true });

    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(envelope)),
      { persistent: true },
    );
  }

  // -----------------------------
  // CONSUMER ← QUEUE
  // -----------------------------
  static async consume<T>(
    queue: string,
    handler: ConsumeHandler<T>,
  ): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ not initialized');

    await this.channel.assertQueue(queue, { durable: true });

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const envelope = JSON.parse(
          msg.content.toString(),
        ) as MessageEnvelope<T>;

        await handler(envelope, msg, this.channel!);
        this.channel!.ack(msg);
      } catch (error) {
        console.error('❌ Message processing failed', error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  // -----------------------------
  // CONSUMER ← EXCHANGE
  // -----------------------------
  static async consumeFromExchange<T>(
    exchange: string,
    queue: string,
    routingKeys: string[],
    handler: ConsumeHandler<T>,
    type: 'topic' | 'direct' | 'fanout' = 'topic',
  ): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ not initialized');

    await this.channel.assertExchange(exchange, type, { durable: true });
    await this.channel.assertQueue(queue, { durable: true });

    for (const key of routingKeys) {
      await this.channel.bindQueue(queue, exchange, key);
    }

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const envelope = JSON.parse(
          msg.content.toString(),
        ) as MessageEnvelope<T>;

        await handler(envelope, msg, this.channel!);
        this.channel!.ack(msg);
      } catch (error) {
        console.error('❌ Message processing failed', error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  static async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = null;
    this.connection = null;
  }
}
