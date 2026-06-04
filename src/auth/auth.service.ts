import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDTO } from '../dto/loing.dto';
import { User } from '../entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { randomInt, randomBytes } from 'crypto';
import { REDIS_CLIENT } from '../redis/redis.provider';
import { Redis } from '@upstash/redis';

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
    // private readonly authProducer: AuthProducer
  ) {}

  async login(
    loginDTO: LoginDTO,
  ): Promise<
    | { accessToken: string; refreshToken: string; success: boolean }
    | { success: boolean }
    | HttpException
  > {
    const user = await this.userRepo.findOneBy({
      phone: loginDTO.phone,
    });

    if (!user) {
      throw new UnauthorizedException(
        'Incorrect credentials. Please enter your phone number and password',
      );
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

    if (!user.passwordSet) {
      return { success: false };
    }

    const passwordMatched = await bcrypt.compare(
      loginDTO.password,
      user.password,
    );

    if (passwordMatched) {
      const {
        password,
        passwordHistory,
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
          purpose: 'refreshToken',
        },
        { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
      );

      const loginToken = this.jwtService.sign(
        {
          sub,
          ...payload,
          purpose: 'accessToken',
        },
        { expiresIn: '60m' },
      );

      // save refreshToken on redis.
      await this.redis.set(
        `auth:refreshToken:user:${sub}`,
        refreshToken,
        {
          ex: 604800,
        },
        // 'EX',
        // 604800,
      );

      if (user.enable2FA) {
        const otp = generateOtp();

        // save accessToken on redis
        await this.redis.set(`auth:accessToken:user:${sub}`, loginToken, {
          ex: 500,
        });

        // save otp on redis
        await this.redis.set(`auth:otp:user:${sub}`, otp, { ex: 300 });
        const url = process.env.SMS_URL!;
        const sender_short_code = process.env.SMS_SHORT_CODE!;
        const message = `Your one time password is ${otp}. Use this to login`;
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
        // const routingKey = 'otp.send'; // user.notificationMethod === NOTIFICATION_METHOD.SMS ? 'notification.sms.send' : 'notification.email.send'
        // const message = `Your One time password is ${otp}`
        // try {
        // await this.authProducer.publishLoginSuccess({
        //   type: 'otp',
        //   otp,
        //   name: `${user.firstName} ${user.lastName}`,
        //   medium: user.notificationMethod,
        //   to: user.notificationMethod === NOTIFICATION_METHOD.SMS ? user.phone : user.email,
        //   message
        // }, {
        //   routingKey
        // });
        // } catch (error) {
        //   console.error(error)
        // }

        return {
          accessToken: this.jwtService.sign(
            { sub, purpose: 'otp' },
            { expiresIn: '3m' },
          ),
          refreshToken: refreshToken,
          success: true,
        };
      }

      await this.redis.del(loginAttemptKey);
      await this.redis.del(temporaryLockKey);
      await this.redis.del(blockUserKey);

      return {
        accessToken: loginToken,
        refreshToken: refreshToken,
        success: true,
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
          'Your account has been blocked. Please contact the administrator.',
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
  ): Promise<{ accessToken: string; refreshToken: string } | HttpException> {
    const savedOtp = await this.redis.get(`auth:otp:user:${userId}`);
    const refreshToken = await this.redis.get(
      `auth:refreshToken:user:${userId}`,
    );
    if (!savedOtp) {
      return new UnauthorizedException();
    }

    if (Number(savedOtp) !== otp) {
      return new UnauthorizedException();
    }

    const savedAccessToken = await this.redis.get(
      `auth:accessToken:user:${userId}`,
    );

    if (!savedAccessToken) {
      return new UnauthorizedException();
    }

    await this.redis.del(`auth:otp:user:${userId}`);
    await this.redis.del(`auth:accessToken:user:${userId}`);

    return {
      accessToken: savedAccessToken as string,
      refreshToken: refreshToken as string,
    };
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
  ): Promise<{ accessToken: string; refreshToken: string } | HttpException> {
    const user = await this.userRepo.findOneBy({ id });

    if (!user) {
      return new UnauthorizedException('Refresh token revoked or expired');
    }

    const jti = randomBytes(64).toString('hex');

    const {
      password,
      passwordHistory,
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
        purpose: 'refreshToken',
      },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
    );

    const accessToken = this.jwtService.sign(
      {
        sub,
        ...payload,
        purpose: 'accessToken',
      },
      { expiresIn: '5m' },
    );

    // save refreshToken on redis
    await this.redis.set(`auth:refreshToken:user:${sub}`, refreshToken, {
      ex: 604800,
    });

    return { refreshToken: refreshToken, accessToken: accessToken };
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
    await this.redis.set(`auth:reset-password-otp:user:${user.id}`, otp, {
      ex: 300,
    });

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
      return new UnauthorizedException(
        `${phone} is not registered registered phone number`,
      );
    }

    const savedOtp = await this.redis.get(
      `auth:reset-password-otp:user:${user.id}`,
    );

    if (!savedOtp) {
      return new UnauthorizedException(`OTP expired`);
    }

    if (String(savedOtp) !== otp) {
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
      {
        password: hashedPassword,
        passwordHistory: newPasswordHistory,
        passwordSet: true,
      },
    );

    return { message: 'your password is successfully changed' };
  }

  async logout(id: string): Promise<{ message: string }> {
    await this.redis.del(`auth:refreshToken:user:${id}`);

    return { message: 'signed out successfully.' };
  }
}
