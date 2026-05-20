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
import { RequestResetPasswordDto } from 'src/dto/request-reset-password.dto';
import { VerifyResetPasswordDto } from 'src/dto/verify-reset-password.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from 'src/entity/user.entity';
@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user' })
  @ApiBody({ type: LoginDTO })
  @ApiResponse({ status: 200, description: 'Success', schema: {
    type: 'object',
    properties: {
      access_token: { type: 'string' },
      refresh_token: { type: 'string' },
    }
  } })
  @ApiResponse({ status: 404, description: 'User not found' })
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

  @Post('logout')
  @UseGuards(AccessTokenJWTGuard)
  async logout(@Req() req): Promise<{ message: string } | HttpException> {
    const { sub } = req.user;

    return await this.authService.logout(sub);
  }

  @Post('reset-password-request')
  async resetPasswordRequest(
    @Body() body: RequestResetPasswordDto,
  ): Promise<{ message: string } | HttpException> {
    return await this.authService.resetPasswordRequest(body.fanNumber);
  }

  @Post('confirm-reset-password-request')
  async verifyResetPasswordRequest(
    @Body() body: VerifyResetPasswordDto,
  ): Promise<{ message: string } | HttpException> {
    return await this.authService.VerifyResetPasswordRequest(
      body.newPassword,
      body.fanNumber,
      body.otp,
    );
  }
}
