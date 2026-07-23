import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
} from 'class-validator';

export class UpdateDriverStatusSchema {
  @ApiProperty({
    description: 'Driver status',
    example: 'ACTIVE',
    required: true,
  })
  @IsString()
  status: string;
}
