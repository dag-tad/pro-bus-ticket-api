// trip-seat.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';

import { Trip } from './trip.entity';
import { Booking } from './booking.entity';
import { TripSeatStatus } from '../enums/trip-seat-status.enum';
import { BookingPassenger } from './booking-passenger.entity';

@Entity('trip_seats')
@Index(['tripId', 'seatNumber'], { unique: true })
@Index(['tripId', 'status'])
@Index(['expiresAt'])
export class TripSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tripId: string;

  @Column()
  seatNumber: string;

  @Column({
    type: 'enum',
    enum: TripSeatStatus,
    default: TripSeatStatus.AVAILABLE,
  })
  status: TripSeatStatus;

  @Column({ nullable: true })
  bookingId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  // Relations
  @ManyToOne(() => Trip, (trip) => trip.tripSeats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @ManyToOne(() => Booking, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking | null;

  @OneToMany(
    () => BookingPassenger,
    (bookingPassenger) => bookingPassenger.tripSeat,
  )
  bookingPassengers: BookingPassenger[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
