import { Module } from '@nestjs/common';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from '../entity/bus.entity';
import { BusModel_Company } from 'src/entity/bus-model_company.entity';
import { BusModel } from 'src/entity/bus-model.entity';
import { UserModule } from 'src/user/user.module';
import { User } from 'src/entity/user.entity';
import { TransportCompany } from 'src/entity/transport-company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserModule, Bus, BusModel, BusModel_Company, User, TransportCompany]), ],
  providers: [BusService],
  controllers: [BusController],
  exports: [BusService]
})
export class BusModule {}
