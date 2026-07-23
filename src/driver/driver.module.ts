import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from 'src/entity/driver.entity';
import { TransportCompany } from 'src/entity/transport-company.entity';
import { User } from 'src/entity/user.entity';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { DriverBus } from 'src/entity/driver-bus.entity';
import { Bus } from 'src/entity/bus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, User, TransportCompany, DriverBus, Bus])],
  providers: [DriverService],
  controllers: [DriverController],
  exports: [DriverService],
})
export class DriverModule {}
