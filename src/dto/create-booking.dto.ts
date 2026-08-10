import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class PassengerDTO {
  @ApiProperty({
    description: 'Full name',
    example: 'Abebe Kebede',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;
  
  @ApiProperty({
    description: 'Phone number',
    example: '0911223344',
  })
  @IsString()
  @IsOptional()
  phone: string;
  
  @ApiProperty({
    description: 'Seat number',
    example: '25',
  })
  @IsString()
  seatNumber: string;
  
  @ApiProperty({
    description: 'Passenger ID number',
    example: '254375',
  })
  @IsString()
  @IsOptional()
  idNumber: string;
}

export class CreateBookingDTO {
  @ApiProperty({
    description: 'Trip ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @ApiProperty({
    description: 'Contact personName',
    example: 'Abebe Kebede',
  })
  @IsString()
  @IsNotEmpty()
  contactPersonName: string;

  @ApiProperty({
    description: 'Contact phone',
    example: '0911687411',
  })
  @IsString()
  @IsOptional()
  contactPersonPhone: string;

  @ApiProperty({
    description: 'List of passengers and their seat number',
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          idNumber: { type: 'string', nullable: true },
          fullName: { type: 'string', nullable: false },
          phone: { type: 'string', nullable: true },
          seatNumber: { type: 'string', nullable: true },
        },
      },
    },
    example: [
        { idNumber: '12345', fullName: 'Abebe Kebede', phone: '0911687411', seatNumber: '12', },
        { idNumber: '54321', fullName: 'Kebede Abebe', phone: '0911687411', seatNumber: '21', },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDTO)
  passengers: PassengerDTO[];
}
