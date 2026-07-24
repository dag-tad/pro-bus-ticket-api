import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/dto/pagination.dto';
import { BusModel } from 'src/entity/bus-model.entity';
import { Bus } from 'src/entity/bus.entity';
import { DriverBus } from 'src/entity/driver-bus.entity';
import { Trip } from 'src/entity/trip.entity';
import { User } from 'src/entity/user.entity';
import { TripStatus } from 'src/enums/trip-status.enum';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { Repository } from 'typeorm';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip) private repo: Repository<Trip>,
    @InjectRepository(Bus) private busRepo: Repository<Bus>,
    @InjectRepository(DriverBus)
    private driverBusRepository: Repository<DriverBus>,
    @InjectRepository(BusModel) private modelRepo: Repository<BusModel>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findAll(options: PaginationDto, companyId?: string): Promise<any> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const scheduledTripBusIds = await this.busRepo
      .createQueryBuilder('bus')
      .select('bus.id')
      .innerJoin('bus.trips', 'trip')
      .where('trip.status = :status', { status: TripStatus.SCHEDULED })
      .andWhere('bus.companyId = :companyId', { companyId })
      .getMany();

    const scheduledBusIds = scheduledTripBusIds.map((bus) => bus.id);

    // Step 2: Get all buses for the company excluding those in scheduled trips
    const query = this.busRepo
      .createQueryBuilder('bus')
      .leftJoinAndSelect('bus.model', 'model')
      .leftJoinAndSelect('bus.driverBuses', 'driverBus')
      .leftJoinAndSelect('driverBus.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .where('bus.companyId = :companyId', { companyId });

    // Only add the NOT IN clause if there are scheduled trips
    if (scheduledBusIds.length > 0) {
      query.andWhere('bus.id NOT IN (:...scheduledBusIds)', {
        scheduledBusIds,
      });
    }

    const availableBuses = await query.getMany();

    // Step 3: Map the data to include only active driver
    const result = availableBuses.map((bus) => {
      // Find the active driver for this bus
      const activeDriverBus = bus.driverBuses?.find(
        (db) => db.isActive === true,
      );

      return {
        ...bus,
        activeDriver: activeDriverBus?.driver || null,
        driverAssignment: activeDriverBus || null,
        model: bus.model,
      };
    });

    const _result = result.map((item: any) => {
      return {
        id: item.id,
        busModelId: item.busModelId,
        model: item.model.model,
        manufacturer: item.model.manufacturer,
        totalSeats: item.model.totalSeats,
        yearOfManufactur: item.model.yearOfManufactur,
        plateNumber: item.plateNumber,
        busNumber: item.busNumber,
        driver: item.driverBuses?.map((db: any) => {
          return {
            firstName: db.driver.user.firstName,
            lastName: db.driver.user.lastName,
            email: db.driver.user.email,
            phone: db.driver.user.phone,
            gender: db.driver.user.gender,
            status: db.isActive,
        }
        }),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    })

    return _result;
  }
}
