// bus.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany,
  ManyToMany,
  JoinTable,
  Index 
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { BusStatus } from 'src/enums/bus-status.enum';
import { Trip } from './trip.entity';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  plateNumber: string; // plate number

  @Column()
  model: string; // e.g., "Toyota Coaster", "Hyundai Universe"

  @Column()
  manufacturer: string; // e.g., "Toyota", "Hyundai", "Isuzu"

  @Column()
  yearOfManufacture: number;

  @Column()
  totalSeats: number;

  @Column({ type: 'json', nullable: true })
  seats: string[]

  @Column({
    type: 'enum',
    enum: BusStatus,
    default: BusStatus.ACTIVE
  })
  status: BusStatus; // ACTIVE, MAINTENANCE, RETIRED

  @Column({ type: 'json', nullable: true })
  amenities: {
    tv: boolean;
    wifi: boolean;
    restRoom: boolean;
    powerOutlate: boolean;
    ac: boolean;
  }

  @Column({ nullable: true })
  baggageCapacity: string; // e.g., "50kg per passenger"

  @Column({ type: 'text', nullable: true })
  notes: string; // Additional notes about the bus

  // Relations
  @ManyToOne(() => TransportCompany, company => company.buses)
  company: TransportCompany;

  @Column()
  companyId: string;

  @OneToMany(() => Trip, trip => trip.bus)
  trips: Trip[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}