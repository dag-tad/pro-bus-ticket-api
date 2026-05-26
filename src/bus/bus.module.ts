import { Module } from '@nestjs/common';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from '../entity/bus.entity';
import { BusModel_Company } from 'src/entity/bus-model_company.entity';
import { BusModel } from 'src/entity/bus-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, BusModel, BusModel_Company])],
  providers: [BusService],
  controllers: [BusController],
  exports: [BusService]
})
export class BusModule {}
