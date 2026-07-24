import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from 'src/entity/bus.entity';
import { Trip } from 'src/entity/trip.entity';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { User } from 'src/entity/user.entity';
import { BusModel } from 'src/entity/bus-model.entity';
import { DriverBus } from 'src/entity/driver-bus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Bus, BusModel, User, DriverBus]), ],
  providers: [TripService],
  controllers: [TripController],
  exports: [TripService]
})
export class TripModule {}
