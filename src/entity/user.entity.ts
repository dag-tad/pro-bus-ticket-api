import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Gender } from '../enums/gender.enum';
import { IsOptional } from 'class-validator';
import { NOTIFICATION_METHOD } from '../enums/notification-method.enum';
import { REALM } from '../enums/realm.enum';
import { ROLE } from '../enums/role.enum';
import { Passenger } from './passenger.entity';
import { TransportCompany } from './transport-company.entity';
import { City } from './cities.entity';
import { BusModel } from './bus-model.entity';
import { Bus } from './bus.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  @IsOptional()
  email: string;

  @Column({ unique: true })
  @IsOptional()
  phone: string;

  @Column({ nullable: true })
  @Exclude()
  @IsOptional()
  password: string;

  @Column({ default: false })
  @IsOptional()
  passwordSet: boolean;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  @Exclude()
  passwordHistory: string[];

  @Column({ nullable: true })
  @Exclude()
  @IsOptional()
  fanNumber: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  lockedReason: string;

  @Column({ default: false, type: 'boolean' })
  enable2FA: boolean;

  @Column({
    type: 'enum',
    enum: NOTIFICATION_METHOD,
    default: NOTIFICATION_METHOD.SMS,
  })
  notificationMethod: NOTIFICATION_METHOD;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender?: Gender;

  @Column({
    type: 'enum',
    enum: REALM,
  })
  realm?: REALM;

  @Column({
    type: 'enum',
    enum: ROLE,
  })
  role?: ROLE;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ nullable: true })
  createdById?: string;

  @OneToMany(() => User, (user) => user.createdBy)
  createdUsers?: User[];

  @Column({ nullable: true })
  companyId?: string;

  @ManyToOne(() => TransportCompany, (company) => company.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'companyId' })  
  company: TransportCompany;

  @ManyToOne(() => User, (user) => user.createdUsers, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @OneToOne(() => Passenger, (passenger) => passenger.user, { cascade: true })
  passenger: Passenger;

  @OneToMany(() => City, (city) => city.createdByUser)
  createdCities: City[];

  @OneToMany(() => City, (city) => city.updatedByUser)
  updatedCities: City[];

  @OneToMany(() => BusModel, (busModel) => busModel.createdBy)
    busModels: BusModel[];

  @OneToMany(() => BusModel, (busModel) => busModel.updatedBy)
    updatedBusModels: BusModel[];

  @OneToMany(() => Bus, (bus) => bus.createdBy)
    createdBusses: Bus[];

  @OneToMany(() => Bus, (bus) => bus.updatedBy)
    updatedBusses: Bus[];
}
