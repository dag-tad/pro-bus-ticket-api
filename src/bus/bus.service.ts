import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { TransportCompany } from 'src/entity/transport-company.entity';
import { DuplicateBusDTO } from 'src/dto/duplicate-bus.dto';

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus) private busRepo: Repository<Bus>,
    @InjectRepository(BusModel) private modelRepo: Repository<BusModel>,
    @InjectRepository(TransportCompany)
    private companyRepo: Repository<TransportCompany>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findAllBusses(
    @Query() options: PaginationDto,
    companyId?: string,
  ): Promise<PaginatedResponse<Bus>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.busRepo.createQueryBuilder('buses');

    if (search) {
      queryBuilder.where(
        `buses.name ILIKE :search OR buses.name ILIKE :search`,
        { search: `%${search}%` },
      );
    }

    if (companyId) {
      queryBuilder.andWhere('bus.companyId = :companyId', { companyId });
    }

    queryBuilder.leftJoinAndSelect('buses.createdBy', 'createdBy');
    queryBuilder.leftJoinAndSelect('buses.updatedBy', 'updatedBy');
    queryBuilder.leftJoinAndSelect('buses.model', 'model');
    queryBuilder.leftJoinAndSelect('buses.company', 'company');

    const [data, totalItems] = await queryBuilder
      .orderBy(`buses.${sortBy}`, sortOrder)
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

  async getBusById(id: string): Promise<Bus | null> {
    return await this.busRepo.findOne({
      where: { id },
      relations: ['model', 'company', 'createdBy'],
    });
  }

  async getBusModelById(id: string): Promise<BusModel | null> {
    return await this.modelRepo.findOneBy({ id });
  }

  async create(data: { userId: string; bus: CreateBusDTO; companyId: string }) {
    const { userId, bus: _bus, companyId } = data;

    let user: User | null = null;
    if (userId) {
      user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ForbiddenException(`Forbbiden or session timeout`);
      }

      let company: TransportCompany | null = null;
      if (companyId) {
        company = await this.companyRepo.findOne({
          where: { id: companyId },
        });

        if (!company) {
          throw new NotFoundException(`Company not found.`);
        }
      }

      const existingBus = await this.busRepo.findOne({
        where: { plateNumber: _bus.plateNumber },
      });

      if (existingBus) {
        throw new BadRequestException(
          `Bus with plate number ${_bus.plateNumber} already exists`,
        );
      }

      const newBus = this.busRepo.create({
        plateNumber: _bus.plateNumber,
        busNumber: _bus.busNumber,
        busModelId: _bus.busModelId,
        seatLayout: _bus.seatLayout,
        status: BusStatus.ACTIVE,
        company: company!,
        createdById: userId!,
      });

      const savedBus = await this.busRepo.save(newBus);

      return await this.busRepo.findOne({
        where: { id: savedBus.id },
        relations: ['model', 'company'],
      });
    }
  }

  async duplicateBus(data: {
    userId: string;
    bus: DuplicateBusDTO;
    companyId: string;
  }) {
    const { userId, bus: _bus, companyId } = data;

    if (!userId) {
      throw new ForbiddenException(`Forbbiden or session timeout`);
    }

    let user: User | null = null;
    user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException(`Forbbiden or session timeout`);
    }

    let company: TransportCompany | null = null;
    if (companyId) {
      company = await this.companyRepo.findOne({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException(`Company not found.`);
      }
    }

    let bus: Bus | null = null;
    if (data.bus.busId) {
      bus = await this.busRepo.findOne({
        where: { id: data.bus.busId },
      });

      if (!bus) {
        throw new NotFoundException(`Source bus not found.`);
      }

      if (
        bus.plateNumber === data.bus.plateNumber ||
        bus.busNumber === data.bus.busNumber
      ) {
        throw new BadRequestException(`Duplicate bus number or plate number`);
      }

      const newBus = this.busRepo.create({
        plateNumber: _bus.plateNumber,
        busNumber: bus.busNumber,
        busModelId: bus.busModelId,
        seatLayout: bus.seatLayout,
        status: BusStatus.ACTIVE,
        company: company!,
        createdById: userId!,
      });

      const savedBus = await this.busRepo.save(newBus);

      return await this.busRepo.findOne({
        where: { id: savedBus.id },
        relations: ['model', 'company'],
      });
    }
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

    const busModel = this.modelRepo.create({
      ..._data,

      createdById: userId,
      createdBy: user,
    });

    return await this.modelRepo.save(busModel);
  }

  async updateBusModel(id: string, _data: CreateBusModelDTO, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const result = await this.modelRepo.update(id, {
      ..._data,
      updatedById: userId,
      updatedBy: user,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Bus model with ID ${id} not found`);
    }

    return this.modelRepo.findOne({ where: { id } });
  }

  async toggleBusModelStatus(id: string, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Invalid user`);
    }

    const busModel = await this.modelRepo.findOne({
      where: { id },
    });

    if (!busModel) {
      throw new NotFoundException(`Bus model with ID ${id} not found`);
    }

    const result = await this.modelRepo.update(id, {
      enabled: !busModel.enabled,
      updatedById: userId,
      updatedBy: user,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Bus model with ID ${id} not found`);
    }

    const model = await this.modelRepo.findOne({ where: { id } });

    return model;
  }
}
