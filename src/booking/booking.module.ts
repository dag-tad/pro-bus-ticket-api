import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Trip } from 'src/entity/trip.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Trip])],
  exports: [BookingService],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
