import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RedisModule } from './redis/redis.module';

import configuration from './config/configuration';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { BusService } from './bus/bus.service';
import { BusController } from './bus/bus.controller';
import { BusModule } from './bus/bus.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
      load: [configuration],
    }),
    RabbitMQModule,
    AuthModule,
    UserModule,
    BusModule,
    RedisModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        url: config.get<string>('DB_URL'),
        ssl: {
          rejectUnauthorized: false,
        },
        autoLoadEntities: true,
        synchronize: true,
        entities: ['dist/**/*.entity.js']
      }),
    }),
  ],
  controllers: [AppController,],
  providers: [AppService,],
})
export class AppModule { }
