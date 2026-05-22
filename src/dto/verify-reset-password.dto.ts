import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Match } from '../util/match.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetPasswordDto {
  @ApiProperty({
      description: 'User\'s phone number',
      example: '0911687411',
      required: true
    })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
      description: 'OTP',
      example: '123456',
      required: true
    })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({
      description: 'New password',
      example: 'password',
      required: true
    })
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  newPassword: string;

  @ApiProperty({
      description: 'Confirm password',
      example: 'password',
      required: true
    })
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  @Match('newPassword', { message: 'Confirm password must match new password' })
  confirmPassword: string;
}
