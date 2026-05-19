// booking.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany,
  Index 
} from 'typeorm';
import { User } from './user.entity';
import { Trip } from './trip.entity';
import { BookingType } from 'src/enums/booking-type.enum';
import { BookingStatus } from 'src/enums/booking-status.enum';
import { Passenger } from './passenger.entity';
import { Payment } from './payment.entity';

@Entity('bookings')
// @Index(['bookingReference', 'confirmationNumber'])
// @Index(['passengerPhone', 'tripId'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  bookingReference: string; // Format: B + timestamp + random (e.g., B20231201123456)

  @Column({ unique: true })
  confirmationNumber: string; // 6-digit number for boarding verification

  @Column({
    type: 'enum',
    enum: BookingType
  })
  bookingType: BookingType; // SELF, PROXY

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING
  })
  status: BookingStatus; // PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW

  @Column()
  seatNumber: string; // e.g., "12A", "B4"

  @Column('decimal', { precision: 10, scale: 2 })
  fare: number; // Price at time of booking

  @Column('decimal', { precision: 10, scale: 2 })
  platformFee: number; // Platform commission/fee

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number; // fare + platformFee

  @Column({ type: 'timestamp' })
  bookingTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  paymentTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancellationTime: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ default: false })
  isBoarded: boolean;

  @Column({ type: 'timestamp', nullable: true })
  boardedAt: Date; 

  @Column({ nullable: true })
  qrCodeUrl: string; // URL to QR code image

  @Column({ type: 'json', nullable: true })
  specialRequests: string[]; // e.g., ["wheelchair", "extra baggage"]

  // Relations
  @ManyToOne(() => User, user => user.id, { nullable: true })
  booker: User; // The person who made the booking (can be null for guest bookings)

  @Column({ nullable: true })
  bookerId: string;

  @ManyToOne(() => Passenger, passenger => passenger.bookings)
  passenger: Passenger; // The actual traveler

  @Column()
  passengerId: string;

  @ManyToOne(() => Trip, trip => trip.bookings)
  trip: Trip;

  @Column()
  tripId: string;

  @OneToMany(() => Payment, payment => payment.booking)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}