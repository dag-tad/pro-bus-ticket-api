import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Driver } from './driver.entity';
import { Bus } from './bus.entity';

@Entity('driver_bus')
export class DriverBus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @Column()
  busId: string;

  @ManyToOne(() => Driver, (driver) => driver.driverBuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @ManyToOne(() => Bus, (bus) => bus.driverBuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'busId' })
  bus: Bus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz' })
  assignedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  unassignedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
