import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Redis from 'ioredis';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.refresh_token,
        (req) => req?.headers?.refresh_token,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const { sub, purpose } = payload;

    if (purpose !== 'refreshToken') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const redisKey = `auth:refreshToken:user:${sub}`;

    const exists = await this.redis.get(redisKey);

    if (!exists) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    return payload;
  }
}
