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
import { CancellationPolicyTierDTO } from './cancellation-policy-tier.dto';

export class UpdateCancellationPolicyDTO {
  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  companyId!: string;

  @ApiProperty({
    description: 'Cancellation policy for the month of August 2026',
    example: 'Some description',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'Policy tier',
    type: 'array',
    items: {
      type: 'object',
      properties: {
          hoursBeforeDeparture: { type: 'number', nullable: false, example: 24 },
          timeWindowLabel: { type: 'string', nullable: false, example: '2 days before departure' },
          refundPercentage: { type: 'number', nullable: false, example: 80 },
        },
    },
    example: [
        { hoursBeforeDeparture: 48, timeWindowLabel: '2 days before departure', refundPercentage: 80 },
        { hoursBeforeDeparture: 24, timeWindowLabel: '1 day before departure', refundPercentage: 60 },
        { hoursBeforeDeparture: 12, timeWindowLabel: '12 hours before departure', refundPercentage: 50 },
    ],
  })
  @IsArray()
  @Type(() => CancellationPolicyTierDTO)
  tiers: CancellationPolicyTierDTO[];
}
