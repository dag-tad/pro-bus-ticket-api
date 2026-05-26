import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransportCompany } from './transport-company.entity';
import { BusModel, SeatLayout } from './bus-model.entity';

@Entity('busModel_company')
export class BusModel_Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  busModelId: string;

  @Column()
  companyId: string;

  @Column({ type: 'json' })
  seatLayout!: object;

  @ManyToOne(() => TransportCompany, (company) => company.busModelLinks)
  @JoinColumn({ name: 'companyId' })
  company: TransportCompany;

  @ManyToOne(() => BusModel, (model: BusModel) => model.companyLinks)
  @JoinColumn({ name: 'busModelId' })
  busModel: BusModel;

  // Helper method for type safety
  getSeatLayout(): SeatLayout {
    return this.seatLayout as SeatLayout;
  }

  setSeatLayout(layout: SeatLayout): void {
    this.seatLayout = layout;
  }
}
