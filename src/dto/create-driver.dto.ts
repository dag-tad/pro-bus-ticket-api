import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsDate,
  IsString,
} from 'class-validator';

export class CreateDriverDTO {
  // @ApiProperty({
  //   description: 'The ID of the company in which the driver is working.',
  //   example: '3d7b5d7c-4c8b-4d3d-9e5c-5b2d6b6b9a1f',
  //   required: false,
  // })
  // @IsString()
  // companyId: string;

  @ApiProperty({
    description: 'User id.',
    example: '3d7b5d7c-4c8b-4d3d-9e5c-5b2d6b6b9a1f',
    required: true,
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Driving license number',
    example: '192021',
    required: false,
  })
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    description: 'Driving license class',
    example: 'Public1',
    required: true,
  }) 
  @IsString()
  licenseClass: string;

  @ApiProperty({
    description: 'Driving license issued at',
    example: '2026-01-09',
    required: false,
  }) 
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date;
    }
    return value;
  })
  @IsDate({ message: "invalid date"})
  drivingLicenseIssuedOn: Date;

  @ApiProperty({
    description: 'Driving license expiredAt at',
    example: '2026-01-09',
    required: false,
  }) 
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date;
    }
    return value;
  })
  @IsDate({message: "Invalid date."})
  drivingLicenseExpiredOn: Date;
}
