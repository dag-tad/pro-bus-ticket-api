import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BusModel_Company } from './bus-model_company.entity';
import { Bus, SeatCell } from './bus.entity';
import { BusClass } from 'src/enums/bus-class.enum';
import { FuelType } from 'src/enums/fuel-type.enum';
import { User } from './user.entity';

export type SeatLayout = SeatCell[][];

@Entity('bus_models')
export class BusModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  model: string; // e.g., "Toyota Coaster", "Hyundai Universe"

  @Column()
  manufacturer: string; // e.g., "Toyota", "Hyundai", "Isuzu"

  @Column()
  yearOfManufacture: number;

  @Column()
  totalSeats: number;

  @Column({
      type: 'enum',
      enum: BusClass,
      nullable: true
    })
    class?: BusClass;

  @Column({
      type: 'enum',
      enum: FuelType,
      nullable: true
    })
    fuelType?: FuelType;

  @Column({ type: 'json', nullable: true })
  seatLayout: object;

  @Column({ type: 'json', nullable: true })
  amenities: {
    tv: boolean;
    wifi: boolean;
    restRoom: boolean;
    usbCharging: boolean;
    ac: boolean;
    recliningSeats: boolean
  };

  // @Column({ nullable: true })
  // baggageCapacity: string; // e.g., "50kg per passenger"

  @Column({ type: 'text', nullable: true })
  description: string; // Additional notes about the bus

  // Relations
  @OneToMany(() => BusModel_Company, (link: BusModel_Company) => link.busModel)
  companyLinks: BusModel_Company[];

  @OneToMany(() => Bus, (bus) => bus.model)
  buses: Bus[];

  @Column({ name: 'createdById', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, (user) => user.busModels, {
    onDelete: 'RESTRICT', // Prevent deletion of user if they have bus models
    onUpdate: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ 
    name: 'createdById',
    referencedColumnName: 'id'
  })
  createdBy: User;

  // @Column()
  // companyId: string;

  // @OneToMany(() => Trip, (trip) => trip.bus)
  // trips: Trip[];

  @CreateDateColumn({ type: 'timestamptz'})
  createdAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  updatedAt: Date;
}
