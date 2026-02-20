import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Gender } from 'src/enums/gender.enum';
import { IsOptional } from 'class-validator';
import { NOTIFICATION_METHOD } from 'src/enums/notification-method.enum';

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
  passwordSet: boolean

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  @Exclude()
  passwordHistory: string[];

  @Column()
  @Exclude()
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

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: Date;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ nullable: true })
  createdById?: string;

  @OneToMany(() => User, (user) => user.createdBy)
  createdUsers?: User[];

  @ManyToOne(() => User, (user) => user.createdUsers, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;
}
