import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Match } from '../util/match.decorator';

export class VerifyResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  fanNumber: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @MinLength(4)
  @MaxLength(32)
  newPassword: string;

  @IsString()
  @MinLength(4)
  @MaxLength(32)
  @Match('newPassword', { message: 'Confirm password must match new password' })
  confirmPassword: string;
}
