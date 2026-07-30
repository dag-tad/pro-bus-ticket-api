import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Trip } from 'src/entity/trip.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BookingService {
  constructor(@InjectRepository(Trip) private repo: Repository<Trip>) {}

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
    const _departureDate = new Date(departureDate).toISOString()
    const date = _departureDate.split('T')[0];
    
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59.999`);

    const trips = await this.repo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.company', 'company')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('trip.bus', 'bus')
      .leftJoinAndSelect('bus.model', 'model')
      .leftJoinAndSelect('trip.originCity', 'originCity')
      .leftJoinAndSelect('trip.destinationCity', 'destinationCity')
      .leftJoinAndSelect('trip.originTerminal', 'originTerminal')
      .leftJoinAndSelect('trip.destinationTerminal', 'destinationTerminal')
      .where('originCity.id = :departureCityId', { departureCityId })
      .andWhere('destinationCity.id = :arrivalCityId', { arrivalCityId })
      .andWhere('trip.departureTime BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .orderBy('trip.departureTime', 'ASC')
      .getMany();

    return trips;
  }
}
