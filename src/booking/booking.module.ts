import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Trip } from 'src/entity/trip.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripSeat } from 'src/entity/trip-seat.entity';
import { CancellationPolicy } from 'src/entity/cancellation-policy.entity';
import { Booking } from 'src/entity/booking.entity';
import { BookingPassenger } from 'src/entity/booking-passenger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripSeat, CancellationPolicy, Booking, BookingPassenger])],
  exports: [BookingService],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
