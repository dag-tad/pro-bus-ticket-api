// trip.entity.ts
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
import { Bus } from './bus.entity';
import { TransportCompany } from './transport-company.entity';
import { TripStatus } from '../enums/trip-status.enum';
import { Booking } from './booking.entity';

@Entity('trips')
// @Index(['originCity', 'destinationCity', 'departureDate'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originCity: string;

  @Column()
  originTerminal: string; // Specific terminal/bus station name

  @Column()
  destinationCity: string;

  @Column()
  destinationTerminal: string;

  @Column({ type: 'timestamp' })
  departureTime: Date;

  @Column({ type: 'timestamp' })
  arrivalTime: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  baseFare: number; // Base price before dynamic pricing

  @Column('decimal', { precision: 10, scale: 2 })
  currentFare: number; // Current price (may include dynamic pricing)

  @Column({ default: 0 })
  availableSeats: number;

  @Column({ default: 0 })
  totalSeats: number;

  @Column({ default: 0 })
  bookedSeats: number;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.SCHEDULED
  })
  status: TripStatus; // SCHEDULED, ON_TIME, DELAYED, CANCELLED, COMPLETED

  @Column({ nullable: true })
  delayMinutes: number;

  @Column({ nullable: true })
  delayReason: string;

  @Column({ default: false })
  isDynamicPricing: boolean;

  // @Column({ type: 'json', nullable: true })
  // dynamicPricingConfig: {
  //   basePrice: number;
  //   surgeMultiplier: number;
  //   demandThreshold: number;
  //   lastUpdated: Date;
  // };

  // Relations
  @ManyToOne(() => Bus, bus => bus.trips)
  bus: Bus;

  @Column()
  busId: string;

  @ManyToOne(() => TransportCompany, company => company.trips)
  company: TransportCompany;

  @Column()
  companyId: string;

  @OneToMany(() => Booking, booking => booking.trip)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}