import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Gender } from 'src/enums/gender.enum';
import { IsOptional } from 'class-validator';
import { NOTIFICATION_METHOD } from 'src/enums/notification-method.enum';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';

@Entity('bus')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  plateNumber: string;

  @Column()
  capacity: number;
}
