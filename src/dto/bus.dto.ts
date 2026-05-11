import { IsEmail, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class BusDTO {
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @IsInt()
  @IsNotEmpty()
  capacity: number;
}
