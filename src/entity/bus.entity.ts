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
  ManyToMany,
  JoinTable,
  Index,
  JoinColumn,
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { BusStatus } from '../enums/bus-status.enum';
import { Trip } from './trip.entity';
import { BusModel } from './bus-model.entity';
import { User } from './user.entity';

export type SeatCell = {
  type: 'seat' | 'aisle' | 'door' | 'restroom';
  seatNumber: number | string | null;
};

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  companyId: string;

  @Column()
  busModelId: string;

  @Column({ unique: true, nullable: false })
  plateNumber: string;

  @Column({ nullable: false })
  busNumber: string;

  @Column({
    type: 'enum',
    enum: BusStatus,
    default: BusStatus.ACTIVE,
  })
  status: BusStatus;

  @Column({ type: 'json', nullable: true })
  seatLayout: object;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => BusModel, (busModel: BusModel) => busModel.buses)
  @JoinColumn({ name: 'busModelId' })
  model: BusModel;

  @ManyToOne(() => TransportCompany, (company) => company.buses)
  @JoinColumn({ name: 'companyId' })
  company: TransportCompany;

  @OneToMany(() => Trip, (trip) => trip.bus)
  trips: Trip[];

  @Column({ name: 'createdById', type: 'uuid' })
  createdById: string;

  @Column({ name: 'updatedById', type: 'uuid', nullable: true })
  updatedById: string;

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
