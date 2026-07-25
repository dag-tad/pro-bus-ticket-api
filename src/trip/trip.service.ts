import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTripDTO } from 'src/dto/create-trip.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { BusModel } from 'src/entity/bus-model.entity';
import { Bus } from 'src/entity/bus.entity';
import { DriverBus } from 'src/entity/driver-bus.entity';
import { Driver } from 'src/entity/driver.entity';
import { Route } from 'src/entity/route.entity';
import { TransportCompany } from 'src/entity/transport-company.entity';
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
    @InjectRepository(Driver) private driverRepo: Repository<Driver>,
    @InjectRepository(BusModel) private modelRepo: Repository<BusModel>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(TransportCompany)
    private companyRepo: Repository<TransportCompany>,
    @InjectRepository(Route) private routeRepo: Repository<Route>,
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
            id: db.driver.id,
            firstName: db.driver.user.firstName,
            lastName: db.driver.user.lastName,
            email: db.driver.user.email,
            phone: db.driver.user.phone,
            gender: db.driver.user.gender,
            status: db.isActive,
          };
        }),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return _result;
  }

  async create(data: {
    userId: string;
    trip: CreateTripDTO;
    companyId: string;
  }) {
    const { userId, trip: _trip, companyId } = data;

    let user: User | null = null;
    if (userId) {
      user = await this.userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new ForbiddenException(`Forbbiden or session timeout`);
      }

      const existingCompany = await this.companyRepo.findOne({
        where: { id: companyId },
      });

      if (!existingCompany) {
        return new NotFoundException(`Company not found.`);
      }

      const existingBus = await this.busRepo.findOne({
        where: { id: _trip.busId },
        relations: {
          model: true,
        },
      });

      if (!existingBus) {
        return new BadRequestException(
          `Bus with id = ${_trip.busId} not found`,
        );
      }

      const existingDriver = await this.driverRepo.findOne({
        where: {
          id: _trip.driverId,
        },
      });

      if (!existingDriver) {
        throw new BadRequestException(
          `Driver with id = ${_trip.driverId} not found`,
        );
      }

      const existingRoute = await this.routeRepo.findOne({
        where: { id: _trip.routeId },
      });

      if (!existingRoute) {
        return new BadRequestException(
          `Route with id = ${_trip.busId} not found`,
        );
      }

      const newTrip = this.repo.create({
        originCity: _trip.originCity,
        destinationCity: _trip.destinationCity,
        originTerminal: 'departure terminal',
        destinationTerminal: 'destination terminal',
        departureTime: new Date(_trip.departureDateTime),
        arrivalTime: new Date(_trip.arrivalDateTime),

        baseFare: _trip.fare,
        currentFare: _trip.fare,

        totalSeats: existingBus.model.totalSeats,
        availableSeats: existingBus.model.totalSeats,
        bookedSeats: 0,

        status: TripStatus.SCHEDULED,

        driver: existingDriver,
        bus: existingBus,
        company: existingCompany,
        route: existingRoute,

        // createdById: userId,
      });

      const savedTrip = await this.repo.save(newTrip);

      return await this.repo.findOne({
        where: { id: savedTrip.id },
      });
    }
  }
}
