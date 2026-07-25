import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  ValidationArguments,
  ValidatorConstraintInterface,
  ValidatorConstraint,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidDateTime', async: false })
export class IsValidDateTime implements ValidatorConstraintInterface {
  validate(text: string) {
    // Check format: YYYY-MM-DDTHH:MM
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!regex.test(text)) return false;
    
    const date = new Date(text);
    
    return !isNaN(date.getTime());
  }

  defaultMessage(args: ValidationArguments) {
    return 'Date must be in format: YYYY-MM-DDTHH:MM';
  }
}

@ValidatorConstraint({ name: 'isBefore', async: false })
export class IsBefore implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    
    if (!value || !relatedValue) return true;
    
    const date1 = new Date(value);
    const date2 = new Date(relatedValue);
    
    return date1.getTime() > date2.getTime();
  }

  defaultMessage(args: ValidationArguments) {
    return `Departure must be before arrival`;
  }
}

@ValidatorConstraint({ name: 'isAtLeast30MinutesAfter', async: false })
export class IsAtLeast30MinutesAfter implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    
    if (!value || !relatedValue) return true;
    
    const dep = new Date(relatedValue);
    const arr = new Date(value);
    const diffMinutes = (arr.getTime() - dep.getTime()) / (1000 * 60);
    
    return diffMinutes >= 30;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Arrival must be at least 30 minutes after departure';
  }
}

export class CreateTripDTO {
  @ApiProperty({
    description: 'Route ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty({
    description: 'Driver ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty({
    description: 'Bus ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  busId: string;

  @ApiProperty({
    description: 'Origin city',
    example: 'Addis Ababa',
  })
  @IsString()
  @IsNotEmpty()
  originCity: string;

  @ApiProperty({
    description: 'Destination city',
    example: 'Hawassa',
  })
  @IsString()
  @IsNotEmpty()
  destinationCity: string;

  @ApiProperty({
    description: 'Departure data & time',
    example: '2026-07-02T23:35',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(IsValidDateTime)
  departureDateTime: string

  @ApiProperty({
    description: 'Arrival date & time',
    example: '2026-07-02T23:35',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(IsValidDateTime)
  @Validate(IsBefore, ['departureDateTime'])
  @Validate(IsAtLeast30MinutesAfter, ['departureDateTime'])
  arrivalDateTime: string

  @ApiProperty({
    description: 'Fare',
    example: 2315,
  })
  @IsNumber()
  @IsPositive()
  fare: number

  @ApiProperty({
    description: 'Estimated duration in minutes',
    example: 675,
  })
  @IsNumber()
  @IsPositive()
  estimatedDuration: number

  @ApiProperty({
    description: 'Description',
    example: 'Some description',
  })
  @IsString()
  @IsOptional()
  description: string;
}
