import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddressDTO {
  @ApiProperty({
    description: 'Region',
    example: 'Addis Ababa',
    required: true
  })
  @IsString()
  region: string;

  @ApiProperty({
    description: 'City',
    example: 'Addis Ababa',
    required: true
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Sub-city or district',
    example: 'Arada',
    required: false
  })
  @IsOptional()
  @IsString()
  subCity?: string;

  @ApiProperty({
    description: 'Woreda',
    example: '03',
    required: false
  })
  @IsOptional()
  @IsString()
  woreda?: string;
}
