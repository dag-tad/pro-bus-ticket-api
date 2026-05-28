import { REGION } from 'src/enums/region.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('cities')
@Unique(['region', 'cityName'])
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: REGION,
  })
  region: REGION;

  @Column()
  cityName: string;

  @Column({
    type: 'timestamptz', 
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt?: Date;

  @ManyToOne(() => User, (user) => user.createdCities)
  @JoinColumn({name: 'createdById'})
  createdByUser: User;

  @ManyToOne(() => User, (user) => user.updatedCities)
  @JoinColumn({name: 'updatedById'})
  updatedByUser: User;
}
