import { IsPhoneNumber } from 'class-validator';

export class RequestResetPasswordDto {
  @IsPhoneNumber()
  phoneNumber: string;
}
