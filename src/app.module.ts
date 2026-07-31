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
import { TerminalsController } from './terminals/terminals.controller';
import { TerminalsService } from './terminals/terminals.service';
import { TerminalsModule } from './terminals/terminals.module';
import { RouteService } from './route/route.service';
import { RouteController } from './route/route.controller';
import { RouteModule } from './route/route.module';
import { DriverController } from './driver/driver.controller';
import { DriverService } from './driver/driver.service';
import { DriverModule } from './driver/driver.module';
import { TripModule } from './trip/trip.module';
import { BookingModule } from './booking/booking.module';

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
    RouteModule,
    RedisModule,
    TransportCompanyModule,
    CityModule,
    TerminalsModule,
    DriverModule,
    TripModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        url: config.get<string>('DB_URL'),
        ssl: {
          rejectUnauthorized: false
        },
        // autoLoadEntities: true,
        synchronize: true,
        // logging: true,
        entities: ['dist/**/*.entity.js']
      }),
    }),
    BookingModule,
  ],
  controllers: [AppController,],
  providers: [AppService],
})
export class AppModule { }
