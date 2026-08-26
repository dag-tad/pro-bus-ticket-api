// booking.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from './user.entity';
import { Trip } from './trip.entity';
import { BookingType } from '../enums/booking-type.enum';
import { BookingStatus } from '../enums/booking-status.enum';
import { Payment } from './payment.entity';
import { BookingPassenger } from './booking-passenger.entity';

@Entity('bookings')
@Index(['tripId', 'status'])
@Index(['status', 'expiresAt'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  orderNumber?: string;

  @Column({ nullable: true })
  externalReferenceId?: string;

  @Column({
    type: 'enum',
    enum: BookingType,
  })
  bookingType: BookingType;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  /**
   * Total fare for all passengers/seats.
   */
  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  fare: number;

  /**
   * Platform fee for the entire booking.
   */
  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  platformFee: number;

  /**
   * fare + platformFee
   */
  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  totalAmount: number;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  expiresAt: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  paymentTime?: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  cancellationTime?: Date;

  @Column({
    nullable: true,
  })
  cancellationReason?: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  refundAmount?: number;

  @Column({
    default: false,
  })
  isBoarded: boolean;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  boardedAt?: Date;

  @Column({
    nullable: true,
  })
  qrCodeUrl?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  specialRequests?: string[];

  @Column({
    nullable: true,
  })
  cancellationPolicyId?: string;

  // ---------------------------------------------------------
  // Booker
  // ---------------------------------------------------------

  @ManyToOne(() => User, (user) => user.bookings, {
    nullable: true,
  })
  @JoinColumn({ name: 'bookerId' })
  booker?: User;

  @Column({
    nullable: true,
  })
  bookerId?: string;

  // ---------------------------------------------------------
  // Trip
  // ---------------------------------------------------------

  @ManyToOne(() => Trip, (trip) => trip.bookings)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  tripId: string;

  // ---------------------------------------------------------
  // Passengers
  // ---------------------------------------------------------

  @OneToMany(
    () => BookingPassenger,
    (bookingPassenger) => bookingPassenger.booking,
    {
      cascade: false,
    },
  )
  passengers: BookingPassenger[];

  // ---------------------------------------------------------
  // Payments
  // ---------------------------------------------------------

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt: Date;
}
