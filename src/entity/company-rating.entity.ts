// company-rating.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  ManyToOne,
  Index 
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { Booking } from './booking.entity';

@Entity('company_ratings')
// @Index(['companyId', 'bookingId'], { unique: true }) // One rating per booking
export class CompanyRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ nullable: true })
  passengerName: string;

  @Column()
  passengerPhone: string;

  @Column({ type: 'json', nullable: true })
  categories: {
    punctuality: number; // 1-5
    cleanliness: number; // 1-5
    comfort: number; // 1-5
    driverBehavior: number; // 1-5
    valueForMoney: number; // 1-5
  };

  @Column({ type: 'json', nullable: true })
  tags: string[]; // e.g., ["on-time", "clean", "friendly-driver"]

  @Column({ default: false })
  isVerified: boolean; // Verified from actual trip

  @Column({ nullable: true })
  response: string; // Company's response to rating

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  // Relations
  @ManyToOne(() => TransportCompany, company => company.ratings)
  company: TransportCompany;

  @Column()
  companyId: string;

  @ManyToOne(() => Booking, { nullable: true })
  booking: Booking;

  @Column({ nullable: true })
  bookingId: string;

  @CreateDateColumn()
  createdAt: Date;
}