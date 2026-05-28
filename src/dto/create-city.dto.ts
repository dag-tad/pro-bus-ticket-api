import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { REGION } from 'src/enums/region.enum';

export class CreateCityDTO {
  @ApiProperty({
    enum: REGION,
    description: 'Region',
    example: 'Tigray',
    required: true,
  })
  @IsEnum(REGION)
  @IsNotEmpty()
  region: REGION;

  @ApiProperty({
    description: 'City name',
    example: 'Mekelle',
  })
  @IsString()
  @IsNotEmpty()
  cityName: string;
}
