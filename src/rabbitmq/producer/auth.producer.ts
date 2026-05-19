// // src/rabbitmq/producers/auth.producer.ts
// import { Injectable } from '@nestjs/common';
// import {
//   AbstractProducer,
//   ProducerConfig,
//   PublishOptions,
// } from './abstract.producer';
// // import { RabbitMQService } from '../rabbitmq.service';
// import { NOTIFICATION_METHOD } from 'src/enums/notification-method.enum';

// export interface LoginSuccessMessage {
//   otp: string;
//   to?: string;
//   type: string;
//   medium: NOTIFICATION_METHOD;
//   name: string;
//   message: string;
//   timestamp?: string;
//   ipAddress?: string;
//   userAgent?: string;
// }

// export interface LoginFailedMessage {
//   email: string;
//   reason: string;
//   timestamp: string;
//   ipAddress?: string;
//   attempts?: number;
// }

// export interface UserRegisteredMessage {
//   userId: string;
//   email: string;
//   name: string;
//   timestamp: string;
// }

// @Injectable()
// export class AuthProducer extends AbstractProducer {
//   constructor(rabbitMQService: RabbitMQService) {
//     const config: ProducerConfig = {
//       exchangeName: 'auth_exchange',
//       exchangeType: 'topic',
//       defaultRoutingKey: 'otp.send',
//       exchangeOptions: {
//         durable: true,
//       },
//     };
//     super(rabbitMQService, config);
//   }

//   /**
//    * Publish login success event
//    */
//   async publishLoginSuccess(
//     data: LoginSuccessMessage,
//     options?: PublishOptions,
//   ): Promise<boolean> {
//     const message = {
//       event: 'otp.send',
//       ...data,
//       timestamp: data.timestamp || new Date().toISOString(),
//     };
// console.log(message, options)
//     return this.publish(message, {
//       routingKey: 'otp.send',
//       ...options,
//     });
//   }

//   /**
//    * Publish login failed event
//    */
//   async publishLoginFailed(
//     data: any,
//     options?: PublishOptions,
//   ): Promise<boolean> {
//     const message = {
//       event: 'login.failed',
//       ...data,
//       timestamp: data.timestamp || new Date().toISOString(),
//     };

//     return this.publish(message, {
//       routingKey: 'login.failed',
//       ...options,
//     });
//   }

//   async publishUserRegistered(
//     data: UserRegisteredMessage,
//     options?: PublishOptions,
//   ): Promise<boolean> {
//     const message = {
//       event: 'user.registered',
//       ...data,
//       timestamp: data.timestamp || new Date().toISOString(),
//     };

//     return this.publish(message, {
//       routingKey: 'user.registered',
//       ...options,
//     });
//   }

//   /**
//    * Publish user password reset event
//    */
//   async publishPasswordReset(
//     userId: string,
//     email: string,
//     options?: PublishOptions,
//   ): Promise<boolean> {
//     const message = {
//       event: 'user.password.reset',
//       userId,
//       email,
//       timestamp: new Date().toISOString(),
//     };

//     return this.publish(message, {
//       routingKey: options?.routingKey,
//       ...options,
//     });
//   }
// }
console.log('')