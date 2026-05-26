import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bus } from '../entity/bus.entity';
import { Repository } from 'typeorm';
import { CreateBusModelDTO } from 'src/dto/bus-model.dto';
import { BusModel } from 'src/entity/bus-model.entity';
import { CreateBusDTO } from 'src/dto/create-bus.dto';
import { BusStatus } from 'src/enums/bus-status.enum';

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus) private busRepo: Repository<Bus>,
    @InjectRepository(BusModel) private modelRepo: Repository<BusModel>,
  ) {}

  async create(data: CreateBusDTO) {
    const bus = new Bus();

    bus.plateNumber = data.plateNumber;
    bus.busModelId = data.busModelId;
    bus.busNumber = data.busNumber;
    bus.companyId = data.companyId;
    bus.seatLayout = data.seatLayout

    return await this.busRepo.save(bus);
  }

  async createBusModel(_data: CreateBusModelDTO) {
    const data = new BusModel();
    data.model = _data.model;
    data.manufacturer = _data.manufacturer;
    data.yearOfManufacture = _data.yearOfManufacture;
    data.description = _data.description;
    data.amenities = _data.amenities;
    data.totalSeats = _data.totalSeats;
    data.seatLayout = _data.seatLayout;

    return await this.modelRepo.save(data);
  }

  async createBus(data: CreateBusDTO) {
    const bus = new Bus();

    bus.busModelId = data.busModelId;
    bus.companyId = data.companyId;
    bus.busModelId = data.busNumber;
    bus.plateNumber = data.plateNumber;

    return await this.busRepo.save(bus);
  }
}
