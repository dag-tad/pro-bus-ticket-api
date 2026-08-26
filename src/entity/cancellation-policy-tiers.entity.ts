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
  Index, 
  JoinColumn
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { Trip } from './trip.entity';
import { CancellationPolicy } from './cancellation-policy.entity';

@Entity('cancellation_policy_tiers')
// @Index(['companyId', 'isActive'])
// @Index(['hoursBeforeDeparture'])
export class CancellationPolicyTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Time threshold (BR02)
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hoursBeforeDeparture: number; // e.g., 2, 1, 0.5

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  refundPercentage: number; // e.g., 80, 50, 0

  // Time window description (e.g., "More than 2 hours before departure")
  @Column({ nullable: true })
  timeWindowLabel: string;

  // @Column({ nullable: true })
  // createdBy: string; 

  @Column({ name: 'policy_tier_id' }) 
  policy_tier_id: string;

  @ManyToOne(() => CancellationPolicy, policy => policy.tiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'policy_tier_id' }) // Match the column name
  cancellationPolicy: CancellationPolicy;
}