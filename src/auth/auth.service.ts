import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
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

  async login(
    loginDTO: LoginDTO,
  ): Promise<
    { 'access-token': string; 'refresh-token': string } | HttpException
  > {
    const user = await this.userRepo.findOneBy({ email: loginDTO.email });

    if (!user) {
      throw new NotFoundException();
    }

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

      // save refresh-token on redis
      await this.redis.set(
        `auth:refresh-token:user:${sub}`,
        refreshToken,
        'EX',
        604800,
      );

      if (user.enable2FA) {
        const otp = generateOtp();
        const url = process.env.SMS_URL!;
        const sender_short_code = process.env.SMS_SHORT_CODE!;
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

        return {
          'access-token': this.jwtService.sign(
            { sub, purpose: 'otp' },
            { expiresIn: '3m' },
          ),
          'refresh-token': refreshToken,
        };
      }
      return {
        'access-token': loginToken,
        'refresh-token': refreshToken,
      };
    } else {
      throw new UnauthorizedException();
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

    const passwordMatched = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatched) {
      throw new BadRequestException('Invalid current password');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.userRepo.update({ id }, { password: hashedPassword });

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

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await this.userRepo.update({ id: user.id }, { password: hashedPassword });

    return { message: 'your password is successfully changed' };
  }
}
