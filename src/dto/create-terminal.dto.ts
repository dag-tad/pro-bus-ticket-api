import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class CreateTerminalDTO {
  @ApiProperty({
    description: 'City ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  cityId: string;

  @ApiProperty({
    description: 'Terminal name',
    example: 'Lamberet',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email',
    example: 'email@example.com',
  })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Phone',
    example: '0911223344',
  })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Short description about the terminal',
    example: 'short description',
  })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'subCity',
    example: 'Yeka',
  })
  @IsOptional()
  subCity?: string;

  @ApiProperty({
    description: 'Woreda',
    example: '09',
  })
  @IsOptional()
  woreda?: string;

  @ApiProperty({
    description: 'Latitude',
    example: '9.08.1',
  })
  @IsOptional()
  latitude?: string;

  @ApiProperty({
    description: 'Longitude',
    example: '38.7656',
  })
  @IsOptional()
  longitude?: string;
}
