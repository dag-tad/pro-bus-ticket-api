import {
  ConflictException,
  Injectable,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bus } from '../entity/bus.entity';
import { Repository } from 'typeorm';
import { CreateBusModelDTO } from 'src/dto/bus-model.dto';
import { BusModel } from 'src/entity/bus-model.entity';
import { CreateBusDTO } from 'src/dto/create-bus.dto';
import { BusStatus } from 'src/enums/bus-status.enum';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { User } from 'src/entity/user.entity';

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus) private busRepo: Repository<Bus>,
    @InjectRepository(BusModel) private modelRepo: Repository<BusModel>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findAllModels(
    @Query() options: PaginationDto,
  ): Promise<PaginatedResponse<BusModel>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.modelRepo.createQueryBuilder('bus_models');

    if (search) {
      queryBuilder.where(
        `bus_models.name ILIKE :search OR bus_models.name ILIKE :search`,
        { search: `%${search}%` },
      );
    }

    queryBuilder.leftJoinAndSelect('bus_models.createdBy', 'createdBy');

    const [data, totalItems] = await queryBuilder
      .orderBy(`bus_models.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit!);
    const hasNextPage = page! < totalPages;
    const hasPreviousPage = page! > 1;

    return {
      data,
      meta: {
        limit: limit!,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        page: page!,
      },
    };
  }

  async create(data: CreateBusDTO) {
    const bus = new Bus();

    bus.plateNumber = data.plateNumber;
    bus.busModelId = data.busModelId;
    bus.busNumber = data.busNumber;
    bus.companyId = data.companyId;
    bus.seatLayout = data.seatLayout;

    return await this.busRepo.save(bus);
  }

  async createBusModel(_data: CreateBusModelDTO, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingModel = await this.modelRepo.findOne({
      where: { model: _data.model },
    });

    if (existingModel) {
      throw new ConflictException(`Bus model "${_data.model}" already exists`);
    }

    // Create the bus model
    const busModel = this.modelRepo.create({
      ..._data,

      createdById: userId,
      createdBy: user,
    });

    return await this.modelRepo.save(busModel);
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
