import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { City } from './cities.entity';
import { Trip } from './trip.entity';
import { User } from './user.entity';
import { TransportCompany } from './transport-company.entity';
import { Terminal } from './terminal.entity';

@Entity('routes')
@Index(['originCityId', 'destinationCityId'])
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => City, { eager: false })
  @JoinColumn({ name: 'originCityId' })
  @Index()
  originCity: City;

  @Column({ name: 'originCityId' })
  originCityId: string;

  @ManyToOne(() => Terminal, { eager: false })
  @JoinColumn({ name: 'originTerminalId' })
  @Index()
  originTerminal: Terminal;

  @Column({ name: 'originTerminalId' })
  originTerminalId: string;

  @ManyToOne(() => City, { eager: false })
  @JoinColumn({ name: 'destinationCityId' })
  @Index()
  destinationCity: City;

  @Column({ name: 'destinationCityId' })
  destinationCityId: string;

  @ManyToOne(() => Terminal, { eager: false })
  @JoinColumn({ name: 'destinationTerminalId' })
  @Index()
  destinationTerminal: Terminal;

  @Column({ name: 'destinationTerminalId' })
  destinationTerminalId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'int', unsigned: true })
  distance: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    unsigned: true,
    default: 0,
  })
  price: number;

  @Column({ type: 'json', nullable: true })
  stops: {
    cityId: string;
    cityName: string;
    stopOrder: number;
    distanceFromOrigin?: number;
  }[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  estimatedDurationMinutes: number;

  @Column()
  companyId: string;

  @ManyToOne(
    () => TransportCompany,
    (company: TransportCompany) => company.routes,
  )
  @JoinColumn({ name: 'companyId' })
  company: TransportCompany;

  @OneToMany(() => Trip, (trip) => trip.route)
  trips: Trip[];

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ name: 'createdById', nullable: true })
  createdById: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'updatedById' })
  updatedBy: User;

  @Column({ name: 'updatedById', nullable: true })
  updatedById: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
  route: {};
}
