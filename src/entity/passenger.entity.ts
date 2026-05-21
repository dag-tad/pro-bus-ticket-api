// passenger.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToOne, 
  OneToMany,
  JoinColumn,
  Index, 
  ManyToOne
} from 'typeorm';
import { User } from './user.entity';
import { Booking } from './booking.entity';
import { RegisteredBy } from '../enums/registered-by.enum';

@Entity('passengers')
// @Index(['nationalId'])
// @Index(['totalTripsCompleted'])
export class Passenger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  userId: string;

  // Passenger-specific fields
  @Column({ nullable: true })
  fanNumber: string; // Optional identification

  @Column({ default: false })
  hasSmartphone: boolean; // Determines if QR code is useful

  @Column({ nullable: true })
  phoneNumber: string

  @Column()
  registeredBy: RegisteredBy
  // @Column({ type: 'json', nullable: true })
  // preferences: {
  //   preferredSeatPosition?: 'window' | 'aisle';
  //   mealPreference?: string;
  //   accessibilityNeeds?: string[];
  //   language?: string;
  //   currency?: string;
  // };

  // Travel statistics
  // @Column({ default: 0 })
  // totalTripsCompleted: number;

  // @Column('float', { default: 0 })
  // averageRatingGiven: number; // Average rating this passenger gives to companies

  // Proxy booking statistics (for passengers who are also proxy bookers)
  // @Column({ default: 0 })
  // totalProxyBookingsMade: number; // Total proxy bookings made by this passenger

  // @Column({ type: 'timestamp', nullable: true })
  // lastProxyBookingAt: Date;

  // @Column({ default: 0 })
  // monthlyProxyBookingCount: number; // Track for AP04 (max 20 per month)

  // @Column({ type: 'timestamp', nullable: true })
  // proxyBookingResetMonth: Date;

  // Frequent passenger information
  // @Column({ type: 'json', nullable: true })
  // frequentRoutes: {
  //   originCityId: string;
  //   destinationCityId: string;
  //   timesTraveled: number;
  //   lastTravelDate: Date;
  // }[];

  // @Column({ type: 'json', nullable: true })
  // loyaltyInfo: {
  //   tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  //   points: number;
  //   joinedAt: Date;
  // };

  // One-to-one relationship with User
  @ManyToOne(() => User, user => user.passenger)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Relations
  @OneToMany(() => Booking, booking => booking.passenger)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  // incrementProxyBookingCount(): void {
  //   this.totalProxyBookingsMade++;
  //   this.monthlyProxyBookingCount++;
  //   this.lastProxyBookingAt = new Date();
    
  //   // Reset monthly count if new month
  //   const now = new Date();
  //   if (!this.proxyBookingResetMonth || 
  //       now.getMonth() !== this.proxyBookingResetMonth.getMonth() ||
  //       now.getFullYear() !== this.proxyBookingResetMonth.getFullYear()) {
  //     this.monthlyProxyBookingCount = 1;
  //     this.proxyBookingResetMonth = now;
  //   }
  // }

  // incrementTripsCompleted(): void {
  //   this.totalTripsCompleted++;
  // }

  // updateAverageRating(newRating: number): void {
  //   const totalRatingSum = this.averageRatingGiven * (this.totalTripsCompleted - 1) + newRating;
  //   this.averageRatingGiven = totalRatingSum / this.totalTripsCompleted;
  // }
}