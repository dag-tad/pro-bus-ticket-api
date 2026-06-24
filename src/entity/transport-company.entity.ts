/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CommissionType } from 'src/enums/commission-type.enum';
// import { SubscriptionPlan } from 'src/enums/subscription-plan.enum';
import { CompanyStatus } from 'src/enums/transport-company.enum';
import { type ICompanySettings } from 'src/interfaces/setting.interface';
import { User } from './user.entity';
import { Bus } from './bus.entity';
import { Trip } from './trip.entity';
import { CompanyRating } from './company-rating.entity';
import { CancellationPolicy } from './cancellation-policy.entity';
import { CompanyDocument } from './document.entity';
import { BusModel_Company } from './bus-model_company.entity';

@Entity('transport_companies')
// @Index(['name', 'status'])
// @Index(['licenseNumber'])
// @Index(['email'])
export class TransportCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic Information
  @Column({ unique: true })
  licenseNumber: string; // Business license number

  @Column({ unique: true })
  name: string; // Legal registered name

  @Column({ nullable: true })
  tradeName: string; // Public-facing brand name

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  alternativePhone: string;

  // Contact Information
  @Column()
  region: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  subcity?: string;

  @Column({ nullable: true })
  woreda?: string;

  // Operational Information
  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING,
  })
  status: CompanyStatus;

  @Column({ type: 'timestamp' })
  createdAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // Subscription & Commission
  // @Column({
  //   type: 'enum',
  //   enum: SubscriptionPlan,
  //   default: SubscriptionPlan.BASIC
  // })
  // subscriptionPlan: SubscriptionPlan;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionStartDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndDate?: Date;

  // Single field for commission (handles both percentage and fixed)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5 })
  commissionValue?: number; // 5 for percentage, or 50 for fixed amount

  @Column({
    type: 'enum',
    enum: CommissionType,
    default: CommissionType.PERCENTAGE,
  })
  commissionType?: CommissionType;

  // Settings
  @Column({ type: 'json', nullable: true })
  settings?: ICompanySettings;

  @Column({ type: 'json', nullable: true })
  notificationPreferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    lowSeatAlert: boolean;
    departureReminder: boolean;
    dailyReport: boolean;
    weeklyReport: boolean;
  };

  // Relations
  @OneToMany(() => BusModel_Company, (link) => link.company)
  busModelLinks: BusModel_Company[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedById' })
  updatedBy: User;

  @Column({ nullable: true })
  updatedById: string;

  @OneToMany(() => Bus, (bus) => bus.company)
  buses: Bus[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ nullable: true })
  approvedById: string;

  @OneToMany(() => BusModel_Company, (link) => link.company)
  busModelLinks: BusModel_Company[];
  // @OneToMany(() => CompanyBankAccount, bankAccount => bankAccount.company)
  // bankAccounts: CompanyBankAccount[];

  @OneToMany(() => Trip, (trip) => trip.company)
  trips: Trip[];

  // @OneToMany(() => CompanyPayout, payout => payout.company)
  // payouts: CompanyPayout[];

  // @OneToMany(() => CompanySubscription, subscription => subscription.company)
  // subscriptions: CompanySubscription[];

  @OneToMany(() => CompanyRating, (rating) => rating.company)
  ratings: CompanyRating[];

  @OneToMany(() => CompanyDocument, (document) => document.company)
  documents: CompanyDocument[];

  @OneToMany(() => CancellationPolicy, (policy) => policy.company)
  cancellationPolicies: CancellationPolicy[];

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  // Virtual properties (not stored in DB, calculated from relations)
  // get totalRevenue(): Promise<number> {
  //   return this.calculateTotalRevenue();
  // }

  // get totalPayout(): Promise<number> {
  //   return this.calculateTotalPayout();
  // }

  // get pendingPayout(): Promise<number> {
  //   return this.calculatePendingPayout();
  // }

  // get totalBuses(): Promise<number> {
  //   return this.calculateTotalBuses();
  // }

  // get totalStaff(): Promise<number> {
  //   return this.calculateTotalStaff();
  // }

  // get activeRoutes(): Promise<number> {
  //   return this.calculateActiveRoutes();
  // }

  // get averageRating(): Promise<number> {
  //   return this.calculateAverageRating();
  // }

  // get totalRatings(): Promise<number> {
  //   return this.calculateTotalRatings();
  // }

  // Helper methods for calculations
  // private async calculateTotalRevenue(): Promise<number> {
  // Aggregate from payouts table
  // const result = await someRepository.sum('totalBookingAmount', { companyId: this.id });
  //   return 0; // result || 0;
  // }

  // private async calculateTotalPayout(): Promise<number> {
  //   // Aggregate from payouts table where status = COMPLETED
  //   // const result = await someRepository.sum('netAmount', {
  //   //   companyId: this.id,
  //   //   status: 'COMPLETED'
  //   // });
  //   return 0; // result || 0;
  // }

  // private async calculatePendingPayout(): Promise<number> {
  //   // Aggregate from payouts table where status = PENDING or PROCESSING
  //   // const result = await someRepository.sum('netAmount', {
  //   //   companyId: this.id,
  //   //   status: In(['PENDING', 'PROCESSING'])
  //   // });
  //   return 0; // result || 0;
  // }

  // private async calculateTotalBuses(): Promise<number> {
  //   return 0; // await someRepository.count({ where: { companyId: this.id } });
  // }

  // private async calculateTotalStaff(): Promise<number> {
  //   return 0;
  //   //  await someRepository.count({
  //   //   where: {
  //   //     companyId: this.id,
  //   //     role: In(['COMPANY_ADMIN', 'DRIVER', 'CONDUCTOR'])
  //   //   }
  //   // });
  // }

  // private async calculateActiveRoutes(): Promise<number> {
  //   // Count distinct routes from trips
  //   // const result = await someRepository.query(
  //   //   `SELECT COUNT(DISTINCT CONCAT(origin_city, '-', destination_city))
  //   //    FROM trips WHERE company_id = $1 AND status = 'SCHEDULED'`,
  //   //   [this.id]
  //   // );
  //   return 0; // parseInt(result[0].count) || 0;
  // }

  // private async calculateAverageRating(): Promise<number> {
  //   const result = 0; // await someRepository.average('rating', { companyId: this.id });
  //   return result || 0;
  // }

  // private async calculateTotalRatings(): Promise<number> {
  //   return await 0; // someRepository.count({ where: { companyId: this.id } });
  // }
}
