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
  OneToMany
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { Trip } from './trip.entity';
import { CancellationPolicyTier } from './cancellation-policy-tiers.entity';

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

  // Policy metadata
  @Column({ type: 'text', nullable: true })
  description: string; 

  // Whether this policy is active
  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CancellationPolicyTier, tier => tier.cancellationPolicy, {
    cascade: true, // Optional: automatically save/update tiers when policy is saved
    eager: false, // Optional: set to true if you want tiers loaded automatically
  })
  tiers: CancellationPolicyTier[];

  // @Column({ nullable: true })
  // createdBy: string; // User ID

  // @Column({ nullable: true })
  // updatedBy: string; // User ID

}