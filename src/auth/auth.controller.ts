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
import { OTPVerifyJWTGuard } from './guard/otp-verify-jwt.guard';
import { RefreshJwtAuthGuard } from './guard/refresh-token-jwt.guard';
import { AccessTokenJWTGuard } from './guard/access-token-jwt.guard';
import { ChangePasswordDto } from 'src/dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Post('login')
  login(
    @Body() loginDTO: LoginDTO,
  ): Promise<
    | { 'access-token': string; 'refresh-token': string }
    | { otpToken: string }
    | HttpException
  > {
    return this.authService.login(loginDTO);
  }

  @Post('verify-otp')
  @UseGuards(OTPVerifyJWTGuard)
  async verifyOTP(
    @Headers('authorization') authHeader: string,
    @Body() otpDto: VerifyOtpDTO,
    @Req() req,
  ): Promise<{ 'access-token': string } | HttpException> {
    const { sub } = req.user;

    return await this.authService.verifyOTP(sub, otpDto.otp);
  }

  @Post('refresh-token')
  @UseGuards(RefreshJwtAuthGuard)
  async refreshToken(
    @Req() req,
  ): Promise<
    { 'access-token': string; 'refresh-token': string } | HttpException
  > {
    const { sub } = req.user;

    return await this.authService.refreshToken(sub);
  }

  @Post('change-password')
  @UseGuards(AccessTokenJWTGuard)
  async changePassword(
    @Body() changePasswordDTO: ChangePasswordDto,
    @Req() req,
  ): Promise<{ message: string } | HttpException> {
    const { sub } = req.user;

    return await this.authService.changePassword(
      sub,
      changePasswordDTO.currentPassword,
      changePasswordDTO.newPassword,
    );
  }
}
