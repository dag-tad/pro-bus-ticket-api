import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt-strategy';
import { RefreshJwtStrategy } from './refresh-token-jwt-strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule, PassportModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }

        return {
          secret,
          signOptions: { expiresIn: '1d' },
        };
      },
    }),
    // ClientsModule.register([
    //   {
    //     name: 'NOTIFICATION_SERVICE',
    //     transport: Transport.RMQ,
    //     options: {
    //       urls: ["amqps://elmmmbip:Dd8P-atTw38DKbZPd2_jW51V6O-V0HL1@collie.lmq.cloudamqp.com/elmmmbip",],
    //       exchange: 'notifications',
    //       exchangeType: 'topic',
    //       queueOptions: {
    //         durable: true,
    //       },
    //     },
    //   },
    // ]),
  ],
  providers: [AuthService, JwtStrategy, RefreshJwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
