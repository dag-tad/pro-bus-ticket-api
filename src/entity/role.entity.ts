import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Realm } from './realm.entity';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ nullable: true })
  realmId?: string;

  @ManyToOne(() => Realm, (realm) => realm.roles, { nullable: true })
  @JoinColumn({ name: 'realmId' })
  realm?: Realm;

  // Permissions relationship (many-to-many)
  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions?: Permission[];

  // Users relationship (many-to-many)
  @ManyToMany(() => User, (user) => user.roles)
  users?: User[];
}