import {
  Body,
  Controller,
  Headers,
  HttpException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDTO } from 'src/dto/loing.dto';
import { AuthService } from './auth.service';
import { VerifyOtpDTO } from 'src/dto/verify-otp.dto';
import { OTPVerifyJWTGuard } from './guard/otp-verify-jwt.gurad';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Post('login')
  login(
    @Body() loginDTO: LoginDTO,
  ): Promise<{ token: string } | { otpToken: string } | HttpException> {
    return this.authService.login(loginDTO);
  }

  @Post('verify-otp')
  @UseGuards(OTPVerifyJWTGuard)
  async verifyOTP(
    @Headers('authorization') authHeader: string,
    @Body() otpDto: VerifyOtpDTO,
    @Req() req,
  ): Promise<{ 'access-token': string } | HttpException> {
    return await new Promise((resolve) => {
      return resolve({ 'access-token': authHeader });
    });
  }
}
