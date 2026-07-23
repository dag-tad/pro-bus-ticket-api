/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  ManyToMany,
  JoinTable,
  Index,
  JoinColumn,
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { BusStatus } from '../enums/bus-status.enum';
import { DriverStatus } from '../enums/driver-status.enum';
import { Trip } from './trip.entity';
import { BusModel } from './bus-model.entity';
import { User } from './user.entity';
import { DriverBus } from './driver-bus.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  companyId: string;

  @Column({ nullable: true })
  tripId: string;

  @Column({ unique: true })
  userId: string;

  @Column({ unique: true, nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  licenseClass: string;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.ACTIVE,
  })
  status: DriverStatus;

  @Column()
  drivingLicensIssuedOn: Date;

  @Column()
  drivingLicenseExpresOn: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => DriverBus, (driverBus) => driverBus.driver)
  driverBuses: DriverBus[];

  @ManyToOne(() => TransportCompany, (company) => company.drivers)
  @JoinColumn({ name: 'companyId' })
  company: TransportCompany;

  @ManyToOne(() => Trip, (trips) => trips.drivers)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @OneToMany(() => Trip, (trip) => trip.bus)
  trips: Trip[];

  @Column({ name: 'createdById', type: 'uuid' })
  createdById: string;

  @Column({ name: 'updatedById', type: 'uuid', nullable: true })
  updatedById: string;

  //relationship
  @OneToOne(() => User, (user) => user.driver, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, (user) => user.createdBusses, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({
    name: 'createdById',
    referencedColumnName: 'id',
  })
  createdBy: User;

  @ManyToOne(() => User, (user) => user.updatedBusses, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'updatedById',
    referencedColumnName: 'id',
  })
  updatedBy: User;
}
