import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsUUID, IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from "class-validator";
import { SeatCellDTO } from "./seat-cell.dto";

export class CreateBusDTO {
  @ApiProperty({
    description: 'Bus Model ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  busModelId!: string;

  @ApiProperty({
    description: 'Plate number',
    example: '3-ET-A12345'
  })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({
    description: 'Bus number',
    example: '4422'
  })
  @IsString()
  @IsNotEmpty()
  busNumber: string;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({
      description: '2D Seat layout array',
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['seat', 'aisle', 'door', 'restRoom'] },
            seatNumber: { type: 'number', nullable: true }
          }
        }
      },
      example: [
        [
          { type: 'seat', seatNumber: 1 },
          { type: 'seat', seatNumber: 2 },
          { type: 'door', seatNumber: null }
        ],
        [
          { type: 'seat', seatNumber: 3 },
          { type: 'seat', seatNumber: 4 },
          { type: 'aisle', seatNumber: null },
          { type: 'seat', seatNumber: 5 }
        ]
      ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SeatCellDTO)
    seatLayout!: SeatCellDTO[][];
  // @ApiProperty({
  //   description: 'Seats configuration',
  //   example: '2x2 layout',
  //   required: false
  // })
  // @IsString()
  // @IsOptional()
  // seats?: number;
}