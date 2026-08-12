import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { Booking } from './booking.entity';
import { Passenger } from './passenger.entity';
import { TripSeat } from './trip-seat.entity';

@Entity('booking_passengers')
@Index(['bookingId', 'passengerId'], { unique: true })
@Index(['bookingId', 'tripSeatId'], { unique: true })
export class BookingPassenger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---------------------------------------------------------
  // Booking
  // ---------------------------------------------------------

  @ManyToOne(() => Booking, (booking) => booking.passengers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column()
  bookingId: string;

  // ---------------------------------------------------------
  // Passenger
  // ---------------------------------------------------------

  @ManyToOne(() => Passenger, (passenger) => passenger.bookingPassengers, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'passengerId' })
  passenger: Passenger;

  @Column()
  passengerId: string;

  // ---------------------------------------------------------
  // Trip Seat
  // ---------------------------------------------------------

  @ManyToOne(() => TripSeat, (tripSeat) => tripSeat.bookingPassengers, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tripSeatId' })
  tripSeat: TripSeat;

  @Column()
  tripSeatId: string;

  // ---------------------------------------------------------
  // Snapshot
  // ---------------------------------------------------------

  /**
   * Store the seat number at booking time.
   *
   * Even though TripSeat has the current seat number,
   * keeping this snapshot protects historical ticket data.
   */
  @Column()
  seatNumber: string;

  /**
   * Fare charged for this passenger.
   *
   * Don't depend on Trip.currentFare later.
   */
//   @Column('decimal', {
//     precision: 10,
//     scale: 2,
//   })
//   fare: number;

  /**
   * Useful if different passengers have different fees.
   */
  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  platformFee: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  totalAmount: number;

  // ---------------------------------------------------------
  // Boarding
  // ---------------------------------------------------------

  @Column({
    default: false,
  })
  isBoarded: boolean;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  boardedAt?: Date;

  // ---------------------------------------------------------
  // Ticket
  // ---------------------------------------------------------

  @Column({
    nullable: true,
  })
  ticketNumber?: string;

  @Column({
    nullable: true,
  })
  qrCodeUrl?: string;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt: Date;
}
