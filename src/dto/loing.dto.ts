import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDTO {
  @ApiProperty({
    description: 'User\'s phone number',
    example: '09xxxxxxxx',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'User\'s password',
    example: 'password',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
