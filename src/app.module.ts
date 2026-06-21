import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RedisModule } from './redis/redis.module';

import configuration from './config/configuration';
// import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { BusModule } from './bus/bus.module';
import { AccessGuard } from './auth/guard/access.guard';
import { TransportCompanyService } from './transport-company/transport-company.service';
import { TransportCompanyController } from './transport-company/transport-company.controller';
import { TransportCompanyModule } from './transport-company/transport-company.module';
import { CityModule } from './city/city.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
      load: [configuration]
    }),
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
        // autoLoadEntities: true,
        synchronize: true,
        // logging: true,
        entities: ['dist/**/*.entity.js']
      }),
    }),
    TransportCompanyModule,
    CityModule,
  ],
  controllers: [AppController,],
  providers: [AppService,],
})
export class AppModule { }
