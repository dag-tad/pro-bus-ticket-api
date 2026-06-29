import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsIn,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO for seat cell
export class SeatCellDTO {
  @ApiProperty({
    enum: ['driver', 'seat', 'aisle', 'door', 'restroom'],
    example: 'seat',
  })
  @IsIn(['driver', 'seat', 'aisle', 'door', 'restroom'])
  @IsNotEmpty()
  type!: 'driver' | 'seat' | 'aisle' | 'door' | 'restroom';

  @ApiProperty({
    type: 'string',
    nullable: true,
    example: 1,
    required: false,
  })
  @IsString()
  @IsOptional()
  seatNumber!: string | null;
}
