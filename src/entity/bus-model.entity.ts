import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BusModel_Company } from './bus-model_company.entity';
import { Bus, SeatCell } from './bus.entity';

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

  @Column({ type: 'json', nullable: true })
  seatLayout: object;

  @Column({ type: 'json', nullable: true })
  amenities: {
    tv: boolean;
    wifi: boolean;
    restRoom: boolean;
    powerOutlet: boolean;
    ac: boolean;
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

  // @Column()
  // companyId: string;

  // @OneToMany(() => Trip, (trip) => trip.bus)
  // trips: Trip[];

  // @CreateDateColumn()
  // createdAt: Date;

  // @UpdateDateColumn()
  // updatedAt: Date;
}
