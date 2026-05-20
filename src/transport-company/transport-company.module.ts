import { Module } from '@nestjs/common';
import { ImageUploader } from './cloudinary.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportCompany } from 'src/entity/transport-company.entity';
import { TransportCompanyService } from './transport-company.service';
import { TransportCompanyController } from './transport-company.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TransportCompany])],
  controllers: [TransportCompanyController], 
  providers: [TransportCompanyService, ImageUploader], 
  exports: [TransportCompanyService, ImageUploader],
})
export class TransportCompanyModule {}
