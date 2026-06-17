import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDTO } from '../dto/loing.dto';
import { AuthService } from './auth.service';
import { VerifyOtpDTO } from '../dto/verify-otp.dto';
import { OTPVerifyJWTGuard } from './guard/otp-verify-jwt.guard';
import { RefreshJwtAuthGuard } from './guard/refresh-token-jwt.guard';
import { AccessTokenJWTGuard } from './guard/access-token-jwt.guard';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestResetPasswordDto } from '../dto/request-reset-password.dto';
import { VerifyResetPasswordDto } from '../dto/verify-reset-password.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequireAccess } from 'src/decorators/access.decorator';
@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user' })
  @ApiBody({ type: LoginDTO })
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async login(
    @Body() loginDTO: LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    // : Promise<
    //   | { 'accessToken': string; 'refreshToken': string, success: boolean }
    //   | { otpToken: string, success: boolean }
    //   | HttpException
    // >
    const result = await this.authService.login(loginDTO);

    if (result instanceof HttpException) {
      return result;
    }

    if (!result.success) {
      return new HttpException(
        {
          status: HttpStatus.NON_AUTHORITATIVE_INFORMATION,
          message: 'Non-Authoritative Information',
          data: {
            message: 'change your password',
            redirectTo: '/admin/change-password',
          },
        },
        HttpStatus.NON_AUTHORITATIVE_INFORMATION,
      );
    }

    if ('accessToken' in result && 'refreshToken' in result) {
      response.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
      });

      response.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      return {
        success: true,
      };
    }
  }

  @Get('me')
  @UseGuards(AccessTokenJWTGuard)
  @RequireAccess(['*'], ['*'])
  me(@Req() req: any) {
    const user = req.user;

    return {
      id: user.userId,
      role: user.role,
      realm: user.realm,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      passwordSet: user.passwordSet,
      purpose: user.purpose,
    };
  }

  @Post('verify-otp')
  @UseGuards(OTPVerifyJWTGuard)
  async verifyOTP(
    @Headers('authorization') authHeader: string,
    @Body() otpDto: VerifyOtpDTO,
    @Req() req,
  ): Promise<{ accessToken: string } | HttpException> {
    const { sub } = req.user;
    return await this.authService.verifyOTP(sub, otpDto.otp);
  }

  @Post('refresh-token')
  @UseGuards(RefreshJwtAuthGuard)
  async refreshToken(
    @Req() req,
  ): Promise<{ accessToken: string; refreshToken: string } | HttpException> {
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
  @RequireAccess(['*'], ['*'])
  async logout(@Req() req): Promise<{ message: string } | HttpException> {
    console.log(req.user)
    const { sub } = req.user;

    return await this.authService.logout(sub);
  }

  @Post('reset-password-request')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiBody({ type: RequestResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  async resetPasswordRequest(
    @Body() body: RequestResetPasswordDto,
  ): Promise<{ message: string } | HttpException> {
    return await this.authService.resetPasswordRequest(body.phone);
  }

  @Post('confirm-reset-password-request')
  async verifyResetPasswordRequest(
    @Body() body: VerifyResetPasswordDto,
  ): Promise<{ message: string } | HttpException> {
    return await this.authService.VerifyResetPasswordRequest(
      body.newPassword,
      body.phone,
      body.otp,
    );
  }
}
