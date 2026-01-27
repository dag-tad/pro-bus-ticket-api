import { IsString, MinLength, MaxLength, Validate } from 'class-validator';
import { Match } from 'src/util/match.decorator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  currentPassword: string;

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
