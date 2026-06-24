import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsNotEmpty, IsString } from "class-validator";

export class DuplicateBusDTO {
  @ApiProperty({
    description: 'Source bus ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  busId?: string;

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
  companyId?: string;
}