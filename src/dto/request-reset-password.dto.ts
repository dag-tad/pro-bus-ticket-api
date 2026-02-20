import { IsPhoneNumber, IsString } from 'class-validator';

export class RequestResetPasswordDto {
  @IsString()
  fanNumber: string;
}
