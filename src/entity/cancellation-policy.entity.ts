// cancellation-policy.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index 
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { Trip } from './trip.entity';

@Entity('cancellation_policies')
// @Index(['companyId', 'isActive'])
// @Index(['hoursBeforeDeparture'])
export class CancellationPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Which company owns this policy
  @ManyToOne(() => TransportCompany, company => company.cancellationPolicies)
  company: TransportCompany;

  @Column()
  companyId: string;

  // Time threshold (BR02)
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hoursBeforeDeparture: number; // e.g., 2, 1, 0.5

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  refundPercentage: number; // e.g., 80, 50, 0

  // Optional: Fixed amount instead of percentage
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedRefundAmount: number; // If set, overrides percentage

  // Policy metadata
  @Column({ type: 'text', nullable: true })
  description: string; // Description of this policy tier

  // Time window description (e.g., "More than 2 hours before departure")
  @Column({ nullable: true })
  timeWindowLabel: string;

  // Whether this policy is active
  @Column({ default: true })
  isActive: boolean;

  // Many-to-many relationship with trips (optional - for trip-specific policies)
  @ManyToMany(() => Trip)
  @JoinTable({
    name: 'trip_cancellation_policies',
    joinColumn: { name: 'policyId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tripId', referencedColumnName: 'id' }
  })
  specificTrips: Trip[];

  // Audit
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string; // User ID

  @Column({ nullable: true })
  updatedBy: string; // User ID

  // Helper methods
  calculateRefundAmount(totalAmount: number): number {
    if (this.fixedRefundAmount) {
      return Math.min(this.fixedRefundAmount, totalAmount);
    }
    return (totalAmount * this.refundPercentage) / 100;
  }

  getDescription(): string {
    if (this.timeWindowLabel) {
      return `${this.timeWindowLabel}: ${this.refundPercentage}% refund`;
    }
    
    if (this.hoursBeforeDeparture === 2) {
      return `2+ hours before departure: ${this.refundPercentage}% refund`;
    } else if (this.hoursBeforeDeparture === 1) {
      return `1-2 hours before departure: ${this.refundPercentage}% refund`;
    } else {
      return `Less than ${this.hoursBeforeDeparture} hours before departure: ${this.refundPercentage}% refund`;
    }
  }
}