import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { CompanyStatus } from 'src/enums/transport-company.enum';

export class UpdateTransportCompanyStatusDTO {
  @ApiProperty({
    description: 'Company\'s status',
    example: 'ACTIVE',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  status: CompanyStatus;
}
