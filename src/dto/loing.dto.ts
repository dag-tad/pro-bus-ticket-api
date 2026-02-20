import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDTO {
  @IsString()
  @IsNotEmpty()
  fanNumber: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
