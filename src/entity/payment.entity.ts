// payment.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  OneToOne,
  OneToMany,
  Index 
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';
import { TransportCompany } from './transport-company.entity';
import { PaymentMethod } from 'src/enums/payment-method.enum';
import { PaymentChannel } from 'src/enums/payment-channel.enum';
import { PaymentStatus } from 'src/enums/payment-status.enum';

@Entity('payments')
// @Index(['transactionReference'])
// @Index(['bookingId', 'status'])
// @Index(['companyId', 'createdAt'])
// @Index(['paymentMethod', 'status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Unique identifiers
  @Column({ unique: true })
  transactionReference: string; // Platform's unique transaction ID

  @Column({ nullable: true })
  gatewayTransactionId: string; // Payment gateway's transaction ID (e.g., Telebirr, Chapa)

  // Relationships
  @ManyToOne(() => Booking, booking => booking.payments)
  booking: Booking;

  @Column({ nullable: true })
  bookingId: string;

  // @ManyToOne(() => User, user => user.paymentsMade)
  // payer: User; // Who made the payment (proxy booker or passenger)

  @Column()
  payerId: string;

  // @ManyToOne(() => TransportCompany, company => company.payments)
  // company: TransportCompany; // Company receiving payment

  @Column()
  companyId: string;

  // Payment Details
  // @Column({
  //   type: 'enum',
  //   enum: PaymentType
  // })
  // paymentType: PaymentType; // BOOKING_PAYMENT, REFUND, COMMISSION_PAYOUT, SUBSCRIPTION

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod; // TELBIRR, CARD, BANK_TRANSFER, CASH

  @Column({
    type: 'enum',
    enum: PaymentChannel
  })
  paymentChannel: PaymentChannel; // MOBILE_APP, WEB, USSD, AGENT

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  // Amounts
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; // Total amount

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  platformFee: number; // Commission taken by platform

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  gatewayFee: number; // Fee charged by payment gateway

  @Column('decimal', { precision: 10, scale: 2 })
  netAmount: number; // amount - platformFee - gatewayFee

  // Currency
  @Column({ default: 'ETB' })
  currency: string;

  // Timing
  @Column({ type: 'timestamp' })
  paymentInitiatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paymentCompletedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paymentFailedAt: Date;

  // For refunds
  @Column({ nullable: true })
  refundReason: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  refundProcessedAt: Date;

  @Column({ nullable: true })
  refundTransactionReference: string; // Reference for refund transaction

  // Payment metadata
  @Column({ type: 'json', nullable: true })
  paymentMetadata: {
    phoneNumber?: string; // Telebirr phone number
    email?: string; // For card payments
    accountNumber?: string; // For bank transfer
    agentCode?: string; // For agent payments
    receiptUrl?: string; // Link to receipt
    customerNote?: string;
  };

  // Failure information
  @Column({ type: 'json', nullable: true })
  failureDetails: {
    code: string;
    message: string;
    retryCount: number;
    lastRetryAt: Date;
  };

  // Settlement information
  @Column({ type: 'timestamp', nullable: true })
  settledAt: Date; // When money was transferred to company

  @Column({ nullable: true })
  settlementReference: string; // Bank transfer reference

  // Audit
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  markAsCompleted(gatewayTransactionId: string): void {
    this.status = PaymentStatus.COMPLETED;
    this.gatewayTransactionId = gatewayTransactionId;
    this.paymentCompletedAt = new Date();
  }

  markAsFailed(errorCode: string, errorMessage: string): void {
    this.status = PaymentStatus.FAILED;
    this.paymentFailedAt = new Date();
    this.failureDetails = {
      code: errorCode,
      message: errorMessage,
      retryCount: (this.failureDetails?.retryCount || 0) + 1,
      lastRetryAt: new Date()
    };
  }

  markAsRefunded(refundAmount: number, refundReference: string): void {
    this.status = PaymentStatus.REFUNDED;
    this.refundAmount = refundAmount;
    this.refundTransactionReference = refundReference;
    this.refundProcessedAt = new Date();
  }
}