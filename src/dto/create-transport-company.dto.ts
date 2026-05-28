import { IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { AddressDTO } from './shared.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransportCompanyDTO {
  @ApiProperty({
    description: 'Company\'s business license number',
    example: '1234567890',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({
    description: 'Company\'s name',
    example: 'Selam Bus S.C.',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Company\'s trade name',
    example: 'Selam Bus',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  tradeName: string;

  @ApiProperty({
    description: 'Description text to be displayed on the company\'s detail page',
    example: 'Selam Bus Line Share Company (Selam Bus Line S.C.) is one of the largest long distance bus companies in Ethiopia. It was founded in 1996 by the Tigray Development Association to address the nationwide need for public transportation.',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Company\'s website it has',
    example: 'https://selambus.com',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  website: string;

  @ApiProperty({
    description: 'Company\'s email',
    example: 'email@selambus.com',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Company\'s phone number',
    example: '09xxxxxxxx or 07xxxxxxxx',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Company\'s alternative phone number if it has any',
    example: '09xxxxxxxx or 07xxxxxxxx',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  alternativePhone: string;

  @ApiProperty({
    description: 'Company\'s region',
    example: 'Addis Ababa',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiProperty({
    description: 'Company\'s city',
    example: 'Addis Ababa',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Subcity',
    example: 'Arada',
  })
  @IsNotEmpty()
  @IsString()
  subcity: string;

  @ApiProperty({
    description: 'Woreda',
    example: '01',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  woreda: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Company logo' })
  logo: string;

  // company's admin information
  @ApiProperty({ type: 'string', description: "Admin first name", example: "Abebe", required: true})
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty({ type: 'string', description: "Admin last name", example: "Kebede", required: true})
  @IsString()
  @IsNotEmpty()
  lastName: string

  @ApiProperty({ type: 'string', description: "Admin phone number", example: "0911223344", required: true})
  @IsString()
  @IsNotEmpty()
  phone: string

  @ApiProperty({ type: 'string', description: "Admin email", example: "admin@company.com", required: true})
  @IsString()
  adminEmail: string
}
