import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BusClass } from 'src/enums/bus-class.enum';
import { FuelType } from 'src/enums/fuel-type.enum';

class SeatCellDTO {
  @ApiProperty({
    enum: ['seat', 'aisle', 'door', 'restroom'],
    example: 'seat',
  })
  @IsString()
  @IsIn(['seat', 'aisle', 'door', 'restroom', 'driver'])
  type!: 'seat' | 'aisle' | 'door' | 'restroom' | 'driver';

  @ApiProperty({
    type: 'number',
    nullable: true,
    example: 12,
  })
  @IsNumber()
  @IsOptional()
  seatNumber!: string | number | null;
}

export class BusAmenitiesDTO {
  @ApiProperty({
    description: 'TV availability',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  tv: boolean;

  @ApiProperty({
    description: 'WiFi availability',
    example: false,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  wifi: boolean;

  @ApiProperty({
    description: 'Restroom availability',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  restroom: boolean;

  @ApiProperty({
    description: 'Power outlet availability',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  usbCharging: boolean;

  @ApiProperty({
    description: 'Air conditioning availability',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  ac: boolean;

  @ApiProperty({
    description: 'Reclining seats availability',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  recliningSeats: boolean;

  @ApiProperty({
    description: 'Reading light availability',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  readingLight: boolean;
}

export class CreateBusModelDTO {
  @ApiProperty({
    description: 'Bus manufacturer name',
    example: 'Toyota',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  manufacturer: string;

  @ApiProperty({
    description: 'Bus model',
    example: 'Coaster',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    description: 'Manufacutred year',
    example: 2026,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  yearOfManufacture: number;

  @ApiProperty({
    description: 'Total seat',
    example: 40,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  totalSeats: number;

  @ApiProperty({
    description: 'Bus amenities',
    type: BusAmenitiesDTO,
    required: false,
    example: {
      tv: true,
      wifi: false,
      restroom: true,
      powerOutlet: true,
      ac: true,
      recliningSeats: true,
      readingLight: true,
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => BusAmenitiesDTO)
  amenities!: BusAmenitiesDTO;

  @ApiProperty({
    description: 'Bus class',
    example: 'standard',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  class: BusClass;

  @ApiProperty({
    description: 'Fuel type',
    example: 'diesel',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  fuelType: FuelType;

  //   @ApiProperty({
  //     description: 'Baggage capacity in kg per passenger',
  //     example: 40,
  //     required: true,
  //   })
  //   @IsPositive()
  //   @IsNotEmpty()
  //   baggageCapacity: number;

  @ApiProperty({
    description: 'Description',
    example: 'description',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '2D Seat layout array',
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['seat', 'aisle', 'door', 'restroom'] },
          seatNumber: { type: 'number', nullable: true },
        },
      },
    },
    example: [
      [
        { type: 'seat', seatNumber: 1 },
        { type: 'seat', seatNumber: 2 },
        { type: 'door', seatNumber: null },
      ],
      [
        { type: 'seat', seatNumber: 3 },
        { type: 'seat', seatNumber: 4 },
        { type: 'aisle', seatNumber: null },
        { type: 'seat', seatNumber: 5 },
      ],
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatCellDTO)
  seatLayout!: SeatCellDTO[][];
}
