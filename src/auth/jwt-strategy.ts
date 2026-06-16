import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const jwtSecret = config.get<string>("JWT_SECRET")

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is missing")
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
       console.log("HEADERS", req.headers.cookie)
  console.log("COOKIES", JSON.stringify( req.cookies, null, 2))

  return req?.cookies?.access_token

    }
      ]),
      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: any) {
    console.log({payload})
    return {
      userId: payload.sub,
      role: payload.role,
      realm: payload.realm,
    }
  }
}
