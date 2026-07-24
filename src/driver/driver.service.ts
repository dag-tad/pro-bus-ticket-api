import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDriverDTO } from 'src/dto/create-driver.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { DriverBus } from 'src/entity/driver-bus.entity';
import { Driver } from 'src/entity/driver.entity';
import { TransportCompany } from 'src/entity/transport-company.entity';
import { User } from 'src/entity/user.entity';
import { DriverStatus } from 'src/enums/driver-status.enum';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { CompanyStatus } from 'src/enums/transport-company.enum';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { DataSource, getConnection, Repository } from 'typeorm';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver) private repo: Repository<Driver>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(TransportCompany)
    private companyRepo: Repository<TransportCompany>,
    @InjectRepository(DriverBus) private driverBusRepo: Repository<DriverBus>,
    private readonly dataSource: DataSource,
  ) {}

  async paginate(
    companyId: string,
    options: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('driver.driverBuses', 'driverBus') // ✅ Join driverBuses
      .leftJoinAndSelect('driverBus.bus', 'bus') // ✅ Join bus through driverBus
      .select([
        'driver.id',
        'driver.licenseNumber',
        'driver.licenseClass',
        'driver.status',
        'driver.drivingLicensIssuedOn',
        'driver.drivingLicenseExpresOn',
        'driver.createdAt',
        'driver.updatedAt',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.email',
        'user.profilePictureUrl',
        'driverBus.id',
        'driverBus.isActive',
        'driverBus.assignedAt',
        'driverBus.unassignedAt',
        'bus.id',
        'bus.plateNumber',
        'bus.busNumber',
        'bus.model',
      ])
      .where('driver.companyId = :companyId', { companyId });

    if (search) {
      queryBuilder.andWhere(
        `(user.firstName ILIKE :search OR 
      user.lastName ILIKE :search OR 
      user.phone ILIKE :search OR 
      driver.licenseNumber ILIKE :search OR
      driver.licenseClass ILIKE :search OR
      bus.plateNumber ILIKE :search OR
      bus.busNumber ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    const totalItems = await queryBuilder.getCount();

    const sortMapping: Record<string, string> = {
      firstName: 'user.firstName',
      lastName: 'user.lastName',
      phone: 'user.phone',
      licenseNumber: 'driver.licenseNumber',
      licenseClass: 'driver.licenseClass',
      status: 'driver.status',
      createdAt: 'driver.createdAt',
      updatedAt: 'driver.updatedAt',
      plateNumber: 'bus.plateNumber',
      busNumber: 'bus.busNumber',
    };

    const sortField = sortMapping[sortBy] || 'driver.createdAt';

    // ✅ Get paginated data
    const data = await queryBuilder
      .orderBy(sortField, sortOrder)
      .addOrderBy('driver.id', 'ASC')
      .skip(skip)
      .take(limit)
      .getMany();

    // ✅ Transform data to include only active bus assignment
    const transformedData = data.map((driver) => {
      // Find the active bus assignment (isActive = true)
      const activeBusAssignment = driver.driverBuses?.find(
        (db) => db.isActive === true,
      );

      // Remove driverBuses from response if you want cleaner data
      const { driverBuses, ...driverWithoutBuses } = driver;

      return {
        ...driverWithoutBuses,
        assignedBus: activeBusAssignment
          ? {
              id: activeBusAssignment.bus.id,
              plateNumber: activeBusAssignment.bus.plateNumber,
              busNumber: activeBusAssignment.bus.busNumber,
              model: activeBusAssignment.bus.model,
              assignedAt: activeBusAssignment.assignedAt,
              isActive: activeBusAssignment.isActive,
            }
          : null, // No active bus assigned
        // Optionally include all assignments if needed
        // allBusAssignments: driverBuses,
      };
    });

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: transformedData,
      meta: {
        limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        page,
      },
    };
  }

  async getDriverById(id: string): Promise<Driver | null> {
    // return await this.repo.findOneBy({ id });
    const queryBuilder = this.repo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('driver.driverBuses', 'driverBus') // ✅ Join driverBuses
      .leftJoinAndSelect('driverBus.bus', 'bus') 
      .select([
        'driver.id',
        'driver.licenseNumber',
        'driver.licenseClass',
        'driver.status',
        'driver.drivingLicensIssuedOn',
        'driver.drivingLicenseExpresOn',
        'driver.createdAt',
        'driver.updatedAt',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.email',
        'user.gender',
        'user.profilePictureUrl',
        'driverBus.id',
        'driverBus.isActive',
        'driverBus.assignedAt',
        'driverBus.unassignedAt',
        'bus.id',
        'bus.plateNumber',
        'bus.busNumber',
        'bus.model',
      ])
      .where('driver.id = :id', { id });

      return await queryBuilder.getOne()
  }

  async createDriver(
    createdById: string,
    companyId: string,
    data: CreateDriverDTO,
  ) {
    try {
      const {
        userId,
        drivingLicenseExpiredOn,
        drivingLicenseIssuedOn,
        licenseClass,
        licenseNumber,
      } = data;

      const driver = await this.repo.findOne({
        where: {
          userId,
          companyId,
        },
      });

      if (driver) {
        return new BadRequestException('This user is already a driver.');
      }

      const createdBy = await this.userRepo.findOne({
        where: {
          id: createdById,
        },
      });

      if (!createdBy) {
        return new BadRequestException('Invalid user');
      }

      const user = await this.userRepo.findOne({
        where: {
          id: userId,
          companyId,
          enabled: true,
        },
      });

      if (!user) {
        return new BadRequestException(
          'The selected user is not found or not active.',
        );
      }

      const company = await this.companyRepo.findOne({
        where: {
          id: companyId,
          status: CompanyStatus.ACTIVE,
        },
      });

      if (!company) {
        return new BadRequestException(
          'The selected company is not found or not active.',
        );
      }

      const result = await this.dataSource.transaction(async (mgr) => {
        await mgr.update(
          User,
          { id: userId },
          {
            role: ROLE.DRIVER,
            realm: REALM.TRANSPORT_COMPANY,
          },
        );

        return await mgr.save(Driver, {
          userId,
          companyId,
          licenseClass,
          licenseNumber,
          drivingLicensIssuedOn: drivingLicenseIssuedOn,
          drivingLicenseExpresOn: drivingLicenseExpiredOn,
          company,
          createdBy,
        });
      });

      return result;
    } catch (error) {
      return new InternalServerErrorException(
        'Drivers can not be created. Please try again letter.',
      );
    }
  }

  async assignDriverToBus(data: {
    driverId: string;
    busId: string;
    userId?: string;
  }) {
    const { driverId, busId, userId } = data;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();

      // Deactivate driver's current assignment
      await queryRunner.manager.update(
        DriverBus,
        {
          driverId,
          isActive: true,
        },
        {
          isActive: false,
          unassignedAt: now,
        },
      );

      // Deactivate bus's current assignment
      await queryRunner.manager.update(
        DriverBus,
        {
          busId,
          isActive: true,
        },
        {
          isActive: false,
          unassignedAt: now,
        },
      );

      // Create new assignment
      const assignment = queryRunner.manager.create(DriverBus, {
        driverId,
        busId,
        isActive: true,
        assignedAt: now,
      });

      await queryRunner.manager.save(assignment);

      await queryRunner.commitTransaction();

      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(data: {
    companyId: string,
    driverId: string;
    status: DriverStatus;
  }) {
      try {
        const { companyId, driverId, status } = data;
console.log({ companyId, driverId, status })
        const driver = await this.repo.findOne({
            where: {
                id: driverId,
                companyId
            }
        })

        if (!driver) {
            return new BadRequestException(`Driver not found.`)
        }
      const now = new Date();

      await this.repo.update({ id: driverId }, { status, updatedAt: now })
      
      return await this.repo.findOne({
        where: { id: driverId }
      })
    } catch (error) {
        console.log(JSON.stringify(error, null, 2))
        return new InternalServerErrorException("Status not updated. Please try again.")
    } 
  }
}
