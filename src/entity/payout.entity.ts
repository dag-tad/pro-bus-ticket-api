// company-payout.entity.ts
import { PayoutStatus } from 'src/enums/payout-status.enum';
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne 
} from 'typeorm';

@Entity('company_payouts')
export class CompanyPayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  payoutReference: string; // Unique payout identifier

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  totalBookingAmount: number; // Total from all bookings

  @Column('decimal', { precision: 10, scale: 2 })
  totalCommission: number; // Platform commission

  @Column('decimal', { precision: 10, scale: 2 })
  netAmount: number; // totalBookingAmount - totalCommission

  @Column('decimal', { precision: 10, scale: 2 })
  amountPaid: number;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PENDING
  })
  status: PayoutStatus; // PENDING, PROCESSING, COMPLETED, FAILED

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  transactionId: string; // Bank/Payment gateway transaction ID

  @Column({ type: 'json', nullable: true })
  bookingBreakdown: {
    totalBookings: number;
    selfBookings: number;
    proxyBookings: number;
    cancelledBookings: number;
    refundedAmount: number;
  };

  @Column({ type: 'json', nullable: true })
  notes: string;

  // Relations
//   @ManyToOne(() => TransportCompany, company => company.payouts)
//   company: TransportCompany;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date
}