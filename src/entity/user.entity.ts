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

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ nullable: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  @Exclude()
  passwordHistory: string[];

  @Column()
  @Exclude()
  fanNumber: string;

  @Column('text', { array: true })
  @Exclude()
  passwordHistor: string[];

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'text' })
  @IsOptional()
  lockedReason: string;

  @Column({ default: false, type: 'boolean' })
  enable2FA: boolean;

  @Column({
    type: 'enum',
    enum: NOTIFICATION_METHOD,
    default: NOTIFICATION_METHOD.EMAIL,
  })
  notificationMethod: NOTIFICATION_METHOD;

  // @Column({ type: 'int', default: 0 })
  // otpRequestCount: number;

  // @Column({ type: 'int', default: 0 })
  // otpVerifyAttemptCount: number;

  // @Column({ type: 'int', default: 0})
  // otpLockCycle: number

  // @Column({ type: 'timestamptz', nullable: true })
  // lastOtpRequestAttempt: Date;

  // @Column({ type: 'timestamptz', nullable: true })
  // lastOtpVerifyAttempt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: Date;

  // @Column({ type: 'int', default: 0 })
  // lastLoginAttemptCount: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  // @CreateDateColumn()
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ nullable: true })
  createdById?: string;

  @OneToMany(() => User, (user) => user.createdBy)
  createdUsers?: User[];

  @ManyToOne(() => User, (user) => user.createdUsers, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  // @Column({ type: 'int', default: 0})
  // loginLockCycle: number

  // @OneToMany(() => Playlist, (playlist) => playlist.user)
  // playLists: Playlist[];
}
