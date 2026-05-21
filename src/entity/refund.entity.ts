// refund.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  Index 
} from 'typeorm';
import { Payment } from './payment.entity';
import { Booking } from './booking.entity';
import { User } from './user.entity';
import { RefundReason } from '../enums/refun-reason.enum';
import { RefundStatus } from '../enums/refund-status.enum';

@Entity('refunds')
// @Index(['bookingId', 'status'])
// @Index(['paymentId'])
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  refundReference: string;

  // @ManyToOne(() => Payment, payment => payment.refunds)
  // payment: Payment;

  @Column()
  paymentId: string;

  @ManyToOne(() => Booking)
  booking: Booking;

  @Column()
  bookingId: string;

  @ManyToOne(() => User)
  requestedBy: User; // User who requested refund (proxy booker or passenger)

  @Column()
  requestedById: string;

  @Column({
    type: 'enum',
    enum: RefundReason
  })
  reason: RefundReason; // CANCELLATION, DISPUTE, DUPLICATE_PAYMENT, FRAUD

  @Column({ type: 'text', nullable: true })
  reasonDescription: string;

  @Column('decimal', { precision: 10, scale: 2 })
  originalAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  refundAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  platformFeeRefunded: number; // Platform fee returned

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING
  })
  status: RefundStatus; // PENDING, APPROVED, REJECTED, PROCESSED, FAILED

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string; // Admin user ID

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  gatewayRefundId: string; // Payment gateway refund reference

  @Column({ type: 'json', nullable: true })
  metadata: {
    cancellationPolicyApplied?: string;
    hoursBeforeDeparture?: number;
    refundPercentage?: number;
    adminNotes?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}