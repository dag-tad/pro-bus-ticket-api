import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDTO } from 'src/dto/loing.dto';
import { User } from 'src/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { randomInt, randomBytes } from 'crypto';
import { REDIS_CLIENT } from 'src/redis/redis.provider';
import Redis from 'ioredis';
import { ChangePasswordDto } from 'src/dto/change-password.dto';
import { ClientProxy } from '@nestjs/microservices';
import { connect } from 'amqp-connection-manager';
import { RabbitMQClient } from 'src/util/messaging/client';
import { SEND_OTP_BY_SMS } from 'src/util/messaging/types/sendOtpBySms';
import { NOTIFICATION_METHOD } from 'src/enums/notification-method.enum';

export function generateOtp(length = 6): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += randomInt(0, 10).toString();
  }
  return otp;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  // async onModuleInit() {
  //   try {
  //     await this.rabbitClient.connect();
  //     console.log('✅ Auth service connected to RabbitMQ');
  //   } catch (err) {
  //     console.log('❌ Producer failed to connect to RabbitMQ', err);
  //   }
  // }

  async login(
    loginDTO: LoginDTO,
  ): Promise<
    { 'access-token': string; 'refresh-token': string } | HttpException
  > {
    const user = await this.userRepo.findOneBy({
      email: loginDTO.email,
    });

    if (!user) {
      throw new UnauthorizedException('Incorrect email.');
    }

    if (!user.enabled) {
      throw new UnauthorizedException(
        'Your account has been blocked. Please contact the administrator.',
      );
    }

    const loginAttemptKey = `auth:login-attempt-count:user:${user.id}`;
    const temporaryLockKey = `auth:temporary-lock:user:${user.id}`;
    const blockUserKey = `auth:block-user:user:${user.id}`;

    const temporaryLocked = (await this.redis.get(
      temporaryLockKey,
    )) as unknown as boolean;

    if (temporaryLocked) {
      throw new UnauthorizedException(
        'You are temporarly locked. Please try again later.',
      );
    }

    const loginAttemptCount = await this.redis.incr(loginAttemptKey);
    this.redis.expire(loginAttemptKey, 180);

    const passwordMatched = await bcrypt.compare(
      loginDTO.password,
      user.password,
    );

    if (passwordMatched) {
      const {
        password,
        passwordHistor,
        enabled,
        enable2FA,
        lastLogin,
        id: sub,
        ...payload
      } = user;

      const jti = randomBytes(64).toString('hex');

      const refreshToken = this.jwtService.sign(
        {
          sub,
          jti,
          purpose: 'refresh-token',
        },
        { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
      );

      const loginToken = this.jwtService.sign(
        {
          sub,
          ...payload,
          purpose: 'access-token',
        },
        { expiresIn: '5m' },
      );

      // save refresh-token on redis.
      await this.redis.set(
        `auth:refresh-token:user:${sub}`,
        refreshToken,
        'EX',
        604800,
      );

      if (user.enable2FA) {
        const otp = generateOtp();
        const message = `Your one time password is ${otp}`;

        // save access-token on redis
        await this.redis.set(
          `auth:access-token:user:${sub}`,
          loginToken,
          'EX',
          500,
        );

        // save otp on redis
        await this.redis.set(`auth:otp:user:${sub}`, otp, 'EX', 300);

        const exchange = 'otp';
        const routeKey =
          user.notificationMethod === NOTIFICATION_METHOD.SMS
            ? 'notification.sms.generated'
            : 'notification.email.generated';
        const event = user.notificationMethod === NOTIFICATION_METHOD.SMS ? 'notification.sms.send' : 'notification.email.send'

        await RabbitMQClient.publish<SEND_OTP_BY_SMS>(exchange, routeKey, {
          event,
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
             otp,
             name: `${user.firstName} ${user.lastName}`,
             email: user.email
          },
        });

        return {
          'access-token': this.jwtService.sign(
            { sub, purpose: 'otp' },
            { expiresIn: '3m' },
          ),
          'refresh-token': refreshToken,
        };
      }

      await this.redis.del(loginAttemptKey);
      await this.redis.del(temporaryLockKey);
      await this.redis.del(blockUserKey);

      return {
        'access-token': loginToken,
        'refresh-token': refreshToken,
      };
    } else {
      const userBlocked = (await this.redis.get(
        blockUserKey,
      )) as unknown as boolean;

      if (loginAttemptCount === 3 && !temporaryLocked && !userBlocked) {
        await this.redis.set(temporaryLockKey, 'true');
        await this.redis.expire(temporaryLockKey, 60);

        await this.redis.set(blockUserKey, 'true');

        await this.redis.set(loginAttemptKey, 0);

        throw new UnauthorizedException(
          'You are temporarly locked. Please try again later.',
        );
      } else if (loginAttemptCount === 3 && userBlocked) {
        await this.userRepo.update(
          { id: user.id },
          { enabled: false, lockedReason: 'Too many login attempt' },
        );

        throw new UnauthorizedException(
          'You account has been blocked. Please contact the administrator.',
        );
      }

      if (loginAttemptCount === 3) {
        await this.redis.expire(loginAttemptKey, 500);
      } else if (loginAttemptCount === 5) {
      }
      throw new UnauthorizedException('Incorrect password');
    }
  }

  async verifyOTP(
    userId: string,
    otp: number,
  ): Promise<{ 'access-token': string } | HttpException> {
    const savedOtp = await this.redis.get(`auth:otp:user:${userId}`);

    if (!savedOtp) {
      return new UnauthorizedException();
    }

    if (parseInt(savedOtp) !== otp) {
      return new UnauthorizedException();
    }

    const savedAccessToken = await this.redis.get(
      `auth:access-token:user:${userId}`,
    );

    if (!savedAccessToken) {
      return new UnauthorizedException();
    }

    await this.redis.del(`auth:otp:user:${userId}`);
    await this.redis.del(`auth:access-token:user:${userId}`);

    return { 'access-token': savedAccessToken };
  }

  async findOne(email: string): Promise<User> {
    const user = await this.userRepo.findOneBy({
      email,
    });

    if (!user) {
      throw new UnauthorizedException('Could not find user');
    }

    return user;
  }

  async refreshToken(
    id: string,
  ): Promise<
    { 'access-token': string; 'refresh-token': string } | HttpException
  > {
    const user = await this.userRepo.findOneBy({ id });

    if (!user) {
      return new UnauthorizedException('Refresh token revoked or expired');
    }

    const jti = randomBytes(64).toString('hex');

    const {
      password,
      passwordHistor,
      enabled,
      enable2FA,
      lastLogin,
      id: sub,
      ...payload
    } = user;

    const refreshToken = this.jwtService.sign(
      {
        sub,
        jti,
        purpose: 'refresh-token',
      },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
    );

    const accessToken = this.jwtService.sign(
      {
        sub,
        ...payload,
        purpose: 'access-token',
      },
      { expiresIn: '5m' },
    );

    // save refresh-token on redis
    await this.redis.set(
      `auth:refresh-token:user:${sub}`,
      refreshToken,
      'EX',
      604800,
    );

    return { 'refresh-token': refreshToken, 'access-token': accessToken };
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string } | HttpException> {
    const user = await this.userRepo.findOneBy({ id });

    if (!user) {
      throw new UnauthorizedException();
    }

    // check if the user has been using the new password previously
    const passwordHistor = user.passwordHistory;

    for (const oldHash of passwordHistor) {
      const match = await bcrypt.compare(newPassword, oldHash);

      if (match) {
        throw new BadRequestException('You cannot reuse an old password');
      }
    }

    const passwordMatched = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatched) {
      throw new BadRequestException('Invalid current password');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const history = Array.isArray(user.passwordHistory)
      ? user.passwordHistory
      : [];

    const newPasswordHistory = [hashedPassword, ...history].slice(
      0,
      parseInt(process.env.MAX_PASSWORD_HISTORY || '7'),
    );

    await this.userRepo.update(
      { id },
      { password: hashedPassword, passwordHistory: newPasswordHistory },
    );

    return { message: 'your password is successfully changed' };
  }

  async resetPasswordRequest(
    phone: string,
  ): Promise<{ message: string } | HttpException> {
    const user = await this.userRepo.findOneBy({ phone });

    if (!user) {
      return new UnauthorizedException(`${phone} is not registered`);
    }

    const otp = generateOtp();
    const url = process.env.SMS_URL!;
    const sender_short_code = process.env.SMS_SHORT_CODE!;
    const message = `Your one time password is ${otp}. Use this to reset your password`;

    // save otp on redis
    await this.redis.set(
      `auth:reset-password-otp:user:${user.id}`,
      otp,
      'EX',
      300,
    );

    // this should be removed from here and be included in the notification service
    await axios.post(
      url,
      {
        sender: sender_short_code,
        to: user.phone,
        message,
      },
      {
        headers: {
          Authorization: process.env.SMS_AUTHORIZATION,
        },
      },
    );

    return { message: 'OTP sent successfully' };
  }

  async VerifyResetPasswordRequest(
    password: string,
    phone: string,
    otp: string,
  ): Promise<{ message: string } | HttpException> {
    const user = await this.userRepo.findOneBy({ phone });

    if (!user) {
      return new UnauthorizedException(`${phone} is not registered`);
    }

    const savedOtp = await this.redis.get(
      `auth:reset-password-otp:user:${user.id}`,
    );

    if (!savedOtp) {
      return new UnauthorizedException(`OTP expired`);
    }

    if (savedOtp !== otp) {
      return new UnauthorizedException('Incorrect OTP');
    }

    // check if the user has been using the new password previously
    const passwordHistor = user.passwordHistory;

    for (const oldHash of passwordHistor) {
      const match = await bcrypt.compare(password, oldHash);

      if (match) {
        throw new BadRequestException('You cannot reuse an old password');
      }
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const history = Array.isArray(user.passwordHistory)
      ? user.passwordHistory
      : [];

    const newPasswordHistory = [hashedPassword, ...history].slice(
      0,
      parseInt(process.env.MAX_PASSWORD_HISTORY || '7'),
    );

    await this.userRepo.update(
      { id: user.id },
      { password: hashedPassword, passwordHistory: newPasswordHistory },
    );

    return { message: 'your password is successfully changed' };
  }

  async logout(id: string): Promise<{ message: string }> {
    await this.redis.del(`auth:refresh-token:user:${id}`);

    return { message: 'signed out successfully.' };
  }
}
