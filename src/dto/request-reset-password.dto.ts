import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RequestResetPasswordDto {
  @ApiProperty({
      description: 'User\'s phone number',
      example: '0911687411',
      required: true
    })
  @IsString()
  phone: string;
}
