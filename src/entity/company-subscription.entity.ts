// company-subscription.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { SubscriptionPlan } from 'src/enums/subscription-plan.enum';
import { SubscriptionStatus } from 'src/enums/subscription-status.enum';

@Entity('company_subscriptions')
export class CompanySubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan
  })
  plan: SubscriptionPlan; // BASIC, PREMIUM, ENTERPRISE

  @Column('decimal', { precision: 10, scale: 2 })
  monthlyFee: number;

  @Column('decimal', { precision: 10, scale: 2 })
  commissionRate: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  status: SubscriptionStatus; // ACTIVE, EXPIRED, CANCELLED, PENDING

  @Column({ type: 'json', nullable: true })
  features: {
    maxBuses: number;
    maxRoutes: number;
    apiAccess: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    smsNotifications: boolean;
    multipleUsers: number;
  };

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  // Relations
  // @ManyToOne(() => TransportCompany, company => company.subscriptions)
  // company: TransportCompany;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}