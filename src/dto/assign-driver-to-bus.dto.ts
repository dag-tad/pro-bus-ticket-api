import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
} from 'class-validator';

export class AssignDriverToBusDTO {
  @ApiProperty({
    description: 'Bus id',
    example: '3d7b5d7c-4c8b-4d3d-9e5c-5b2d6b6b9a1f',
    required: true,
  })
  @IsString()
  busId: string;
}
