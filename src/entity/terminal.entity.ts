// terminal.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToMany,
  OneToMany,
  ManyToOne,
  JoinTable,
  Index 
} from 'typeorm';
import { Trip } from './trip.entity';

@Entity('terminals')
// @Index(['name', 'cityId'])
export class Terminal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g., "Megenagna Bus Terminal", "Akaki Station"

  // @ManyToOne(() => City, city => city.terminals)
  // city: City;

  @Column()
  city: string;

  @Column({ type: 'json', nullable: true })
  address: {
    subCity: string,
    woreda: string,
    kebele: string,
  };

  @Column({ type: 'json', nullable: true })
  coordinates: {
    lat: number;
    lng: number;
  };

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Operating hours
//   @Column({ type: 'json', nullable: true })
//   operatingHours: {
//     monday: { open: string; close: string };
//     tuesday: { open: string; close: string };
//     wednesday: { open: string; close: string };
//     thursday: { open: string; close: string };
//     friday: { open: string; close: string };
//     saturday: { open: string; close: string };
//     sunday: { open: string; close: string };
//   };

  @Column({ default: true })
  isActive: boolean;

//   @Column({ nullable: true })
//   totalGates: number;

//   @Column({ nullable: true })
//   totalParkingSpaces: number;

  // Government/Ethiopian Road Transport Authority managed
//   @Column({ nullable: true })
//   operator: string; // e.g., "Addis Ababa City Government", "Ethiopian Road Transport Authority"

  // Relations
  // @ManyToMany(() => TransportCompany, company => company.terminals)
  // @JoinTable({
  //   name: 'terminal_companies',
  //   joinColumn: { name: 'terminalId', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'companyId', referencedColumnName: 'id' }
  // })
  // companies: TransportCompany[];

  // @OneToMany(() => Trip, trip => trip.departureTerminal)
  // departingTrips: Trip[];

  // @OneToMany(() => Trip, trip => trip.arrivalTerminal)
  // arrivingTrips: Trip[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}