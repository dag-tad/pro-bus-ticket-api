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
import { BusStatus } from 'src/enums/bus-status.enum';
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

  async findAllTrips(options: PaginationDto, companyId?: string): Promise<any> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const trips = await this.repo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('trip.bus', 'bus')
      .leftJoinAndSelect('trip.originCity', 'originCity')
      .leftJoinAndSelect('trip.destinationCity', 'destinationCity')
      .leftJoinAndSelect('trip.originTerminal', 'originTerminal')
      .leftJoinAndSelect('trip.destinationTerminal', 'destinationTerminal')
      .where('trip.companyId = :companyId', { companyId })
      .orderBy('trip.departureTime', 'ASC')
      .getMany();

    return trips;
  }

  async searchTrips(
    options: PaginationDto & {
      departureCityId: string;
      arrivalCityId: string;
      departureDate: string;
    },
  ): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder,
      departureCityId,
      arrivalCityId,
      departureDate,
    } = options;
    const skip = (page - 1) * limit;

    const trips = await this.repo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.company', 'company')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('trip.bus', 'bus')
      .leftJoinAndSelect('trip.originCity', 'originCity')
      .leftJoinAndSelect('trip.destinationCity', 'destinationCity')
      .leftJoinAndSelect('trip.originTerminal', 'originTerminal')
      .leftJoinAndSelect('trip.destinationTerminal', 'destinationTerminal')
      .where('originCity.id = :departureCityId', { departureCityId })
      .andWhere('destinationCity.id = :arrivalCityId', { arrivalCityId })
      .orderBy('trip.departureTime', 'ASC')
      .getMany();

    return trips;
  }

  async getDetail(id: string, companyId: string): Promise<any> {
    const trips = await this.repo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('trip.bus', 'bus')
      .leftJoinAndSelect('bus.model', 'model')
      .leftJoinAndSelect('trip.originCity', 'originCity')
      .leftJoinAndSelect('trip.route', 'route')
      .leftJoinAndSelect('trip.destinationCity', 'destinationCity')
      .leftJoinAndSelect('trip.originTerminal', 'originTerminal')
      .leftJoinAndSelect('trip.destinationTerminal', 'destinationTerminal')
      .where('trip.companyId = :companyId', { companyId })
      .andWhere('trip.id = :id', { id })
      .orderBy('trip.departureTime', 'ASC')
      .getOne();

    return trips;
  }

  async findAllBusses(
    options: PaginationDto & { departureDate: string },
    companyId: string,
  ): Promise<any> {
    const { page = 1, limit = 100, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const date = options.departureDate.split('T')[0];
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59.999`);

    // Find buses already scheduled on the requested date
    const scheduledTrips = await this.repo
      .createQueryBuilder('trip')
      .select('trip.busId', 'busId')
      .where('trip.status = :status', {
        status: TripStatus.SCHEDULED,
      })
      .andWhere('trip.companyId = :companyId', {
        companyId,
      })
      .andWhere('trip.departureTime BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .getRawMany();

    const scheduledBusIds = scheduledTrips.map((t) => t.busId);

    const query = this.busRepo
      .createQueryBuilder('bus')
      .leftJoinAndSelect('bus.model', 'model')
      .leftJoinAndSelect('bus.driverBuses', 'driverBus')
      .leftJoinAndSelect('driverBus.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .where('bus.companyId = :companyId', {
        companyId,
      })
      .andWhere('bus.status = :status', {
        status: BusStatus.ACTIVE,
      });

    if (scheduledBusIds.length) {
      query.andWhere('bus.id NOT IN (:...scheduledBusIds)', {
        scheduledBusIds,
      });
    }

    const [data, totalItems] = await query
      // .orderBy(`bus.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit!);
    const hasNextPage = page! < totalPages;
    const hasPreviousPage = page! > 1;

    const busses = data.map((bus) => {
      const activeAssignment = bus.driverBuses.find((d) => d.isActive);
      return {
        id: bus.id,
        busModelId: bus.busModelId,
        model: bus.model.model,
        manufacturer: bus.model.manufacturer,
        totalSeats: bus.model.totalSeats,
        yearOfManufactur: bus.model.yearOfManufacture,
        plateNumber: bus.plateNumber,
        busNumber: bus.busNumber,
        driver: activeAssignment
          ? {
              id: activeAssignment.driver.id,
              firstName: activeAssignment.driver.user.firstName,
              lastName: activeAssignment.driver.user.lastName,
              email: activeAssignment.driver.user.email,
              phone: activeAssignment.driver.user.phone,
              gender: activeAssignment.driver.user.gender,
            }
          : null,
        createdAt: bus.createdAt,
        updatedAt: bus.updatedAt,
      };
    });

    return {
      data: busses,
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

  async getStats(
    companyId: string,
  ): Promise<{ status: string; count: number }[]> {
    const statuses = Object.values(TripStatus);

    // Count for each status individually
    const counts = await Promise.all(
      statuses.map(async (status) => {
        const count = await this.repo.count({
          where: {
            companyId: companyId,
            status: status,
          },
        });
        return { status, count };
      }),
    );

    const totalTrips = await this.repo.count({
      where: {
        companyId,
      },
    });

    return [{ status: 'total_trips', count: totalTrips }, ...counts];
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
        originCityId: _trip.originCityId,
        destinationCityId: _trip.destinationCityId,
        originTerminalId: _trip.originTerminalId,
        destinationTerminalId: _trip.destinationTerminalId,
        departureTime: new Date(_trip.departureDateTime),
        arrivalTime: new Date(_trip.arrivalDateTime),
        estimatedDuration: _trip.estimatedDuration,

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
