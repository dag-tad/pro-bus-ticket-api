import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Trip } from 'src/entity/trip.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripSeat } from 'src/entity/trip-seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripSeat])],
  exports: [BookingService],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
