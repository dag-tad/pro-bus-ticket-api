import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusDTO } from 'src/dto/bus.dto';
import { Bus } from 'src/entity/bus.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BusService {
    constructor(@InjectRepository(Bus) private busRepo: Repository<Bus>,) { }

    async create(busDto: BusDTO): Promise<Bus> {
        const bus = new Bus()
        
        bus.totalSeats = busDto.capacity
        bus.plateNumber = busDto.plateNumber

        const result = await this.busRepo.save(bus)
        return result
    }
}
