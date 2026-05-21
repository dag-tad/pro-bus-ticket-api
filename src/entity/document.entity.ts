// company-document.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { User } from './user.entity';
import { DocumentType } from '../enums/document-type.enum';

@Entity('company_documents')
export class CompanyDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: DocumentType;

  @Column()
  name: string;

  @Column()
  fileUrl: string;

  // @Column({ nullable: true })
  // fileKey: string; // S3 or cloud storage key

  // @Column({ type: 'timestamp', nullable: true })
  // expiryDate: Date;

  // @Column({ default: false })
  // isVerified: boolean;

  // @Column({ type: 'timestamp', nullable: true })
  // verifiedAt: Date;

  @ManyToOne(() => TransportCompany, company => company.documents)
  company: TransportCompany;

  @Column()
  companyId: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @Column()
  uploadedById: string;

  // @ManyToOne(() => User, { nullable: true })
  // verifiedBy: User;

  // @Column({ nullable: true })
  // verifiedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}