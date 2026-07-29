import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min, ValidateNested } from 'class-validator';

export class RouteStopDto {
  @ApiProperty({
    description: 'The ID of the stop city.',
    example: '3d7b5d7c-4c8b-4d3d-9e5c-5b2d6b6b9a1f',
  })
  @IsString()
  @IsNotEmpty()
  cityName: string;

  @ApiProperty({
    description: 'Distance of the stop from the origin city in kilometers.',
    example: 120,
    minimum: 1,
    maximum: 9999,
  })
  @IsNumber()
  @Min(1)
  @Max(9999)
  distanceFromOrigin: number;
}

export class CreateRouteDto {
  @ApiPropertyOptional({
    description: 'Optional company id.',
    example: 'e8d7d4e1-2a2b-4d76-b2c4-5e8b0d2d9c10',
  })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({
    description: 'Origin city ID.',
    example: 'e8d7d4e1-2a2b-4d76-b2c4-5e8b0d2d9c10',
  })
  @IsString()
  origin: string;

  @ApiProperty({
    description: 'Destination city ID.',
    example: 'c9b8a7d6-5f4e-4321-9876-123456789abc',
  })
  @IsString()
  destination: string;

  @ApiProperty({
    description: 'Origin terminal ID.',
    example: 'e8d7d4e1-2a2b-4d76-b2c4-5e8b0d2d9c10',
  })
  @IsString()
  originTerminalId: string;

  @ApiProperty({
    description: 'Destination terminal ID.',
    example: 'c9b8a7d6-5f4e-4321-9876-123456789abc',
  })
  @IsString()
  destinationTerminalId: string;

  @ApiPropertyOptional({
    description: 'Optional description of the route.',
    example: 'Express route via Adama.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Total distance of the route in kilometers.',
    example: 450,
    minimum: 1,
    maximum: 9999,
  })
  @IsNumber()
  @Min(1)
  @Max(9999)
  distance: number;

  @ApiProperty({
    description: 'Estimated duration of the route in minutes.',
    example: 360,
    minimum: 1,
    maximum: 1440,
  })
  @IsNumber()
  @Min(1)
  @Max(1440)
  duration: number;

  @ApiProperty({
    description: 'Ticket price in ETB.',
    example: 850,
    minimum: 1,
    maximum: 999999,
  })
  @IsNumber()
  @Min(1)
  @Max(999999)
  fare: number;

  @ApiProperty({
    description:
      'Ordered list of intermediate stops between the origin and destination.',
    type: [RouteStopDto],
    example: [
      {
        cityName: 'Addis Ababa',
        distanceFromOrigin: 120,
      },
      {
        cityName: 'Debre Birhan',
        distanceFromOrigin: 250,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops: RouteStopDto[];
}
