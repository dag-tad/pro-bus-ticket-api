import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from 'src/enums/gender.enum';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';

export class UpdateUserDTO {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  fanNumber: string;

  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsEnum(ROLE)
  role: ROLE;

  @IsOptional()
  @IsEnum(REALM)
  realm: REALM;
}
