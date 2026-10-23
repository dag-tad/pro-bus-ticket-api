import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AddressDTO } from './shared.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTransportCompanyDTO {
  @ApiProperty({
    description: 'Company\'s business license number',
    example: '1234567890',
    required: true
  })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({
    description: 'Company\'s name',
    example: 'Selam Bus S.C.',
    required: true
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Company\'s trade name',
    example: 'Selam Bus',
    required: true
  })
  @IsString()
  @IsOptional()
  tradeName?: string;

  @ApiProperty({
    description: 'Description text to be displayed on the company\'s detail page',
    example: 'Selam Bus Line Share Company (Selam Bus Line S.C.) is one of the largest long distance bus companies in Ethiopia. It was founded in 1996 by the Tigray Development Association to address the nationwide need for public transportation.',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Company\'s website it has',
    example: 'https://selambus.com',
    required: false
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Company\'s email',
    example: 'email@selambus.com',
    required: false
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Company\'s phone number',
    example: '09xxxxxxxx or 07xxxxxxxx',
    required: false
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Company\'s alternative phone number if it has any',
    example: '09xxxxxxxx or 07xxxxxxxx',
    required: true
  })
  @IsString()
  @IsOptional()
  alternativePhone?: string;

  @ApiProperty({
    description: 'Company\'s region',
    example: 'Addis Ababa',
    required: true
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'Company\'s city',
    example: 'Addis Ababa',
    required: true
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Subcity',
    example: 'Arada',
  })
  @IsString()
  @IsOptional()
  subcity?: string;

  @ApiProperty({
    description: 'Woreda',
    example: '01',
    required: false
  })
  @IsString()
  @IsOptional()
  woreda?: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Company logo' })
  @IsOptional()
  logo?: string;
}
