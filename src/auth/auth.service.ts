import {
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
import { randomInt, sign } from 'crypto';
import { VerifyOtpDTO } from 'src/dto/verify-otp.dto';
import { REDIS_CLIENT } from 'src/redis/redis.provider';
import Redis from 'ioredis';

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
  ): Promise<{ token: string; purpose: string } | HttpException> {
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

      const loginToken = this.jwtService.sign({ sub, ...payload });
      // auth:session:user:{userId}

      if (user.enable2FA) {
        const otp = generateOtp();
        const url = process.env.SMS_URL!;
        const sender_short_code = process.env.SMS_SHORT_CODE!;
        const message = `Your one time password is ${otp}`;

        // save access-token on redis server
        await this.redis.set(
          `auth:access-token:user:${sub}`,
          loginToken,
          'EX',
          500,
        );

        // save otp on redis servier
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

        return { token: this.jwtService.sign({ sub }), purpose: 'otp' };
      }

      return {
        token: loginToken,
        purpose: 'login',
      };
    } else {
      throw new UnauthorizedException();
    }
  }

  // async verifyOTP(
  //   otpDto: VerifyOtpDTO,
  // ): Promise<{ token: string } | { otpToken: string } | HttpException> {

  //  await this.redis.set(
  //     `auth:otp:user:${userId}`,
  //     otp,
  //     'EX',
  //     300,
  //   );
  //     return {  };
  // }

  async findOne(email: string): Promise<User> {
    const user = await this.userRepo.findOneBy({
      email,
    });

    if (!user) {
      throw new UnauthorizedException('Could not find user');
    }

    return user;
  }
}
