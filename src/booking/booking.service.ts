import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CreateBookingDTO } from 'src/dto/create-booking.dto';
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
    const _departureDate = new Date(departureDate).toISOString();
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

  async getTripDetail(id: string): Promise<any> {
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
      .where('trip.id = :id', { id })
      .getOne();

    return trips;
  }

  async createBooking(data: CreateBookingDTO) {
    const trip = await this.repo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.company', 'company')
      .leftJoinAndSelect('trip.originCity', 'originCity')
      .leftJoinAndSelect('trip.destinationCity', 'destinationCity')
      .leftJoinAndSelect('trip.originTerminal', 'originTerminal')
      .leftJoinAndSelect('trip.destinationTerminal', 'destinationTerminal')
      .where('trip.id = :id', { id: data.tripId })
      .getOne();

    if (!trip) {
      throw new NotFoundException(`Invalid trip`);
    }

    const _items = data.passengers.map((p: { fullName: string }) => {
      return {
        productId: data.tripId,
        quantity: 1,
        item_name: `${p.fullName} = Trip from ${trip.originCity.cityName} -> ${trip.destinationCity.cityName}`,
        unit_price: Number(trip.baseFare),
      };
    });

    const now = new Date();
    const expiredAt = new Date(now.getTime() + 10 * 60 * 1000);

    const result = await axios.post(
      process.env.STARPAY_PAYMENT_URL!,
      {
        amount: trip.baseFare * data.passengers.length,
        description: `Trip from ${trip.originCity.cityName} -> ${trip.destinationCity.cityName}`,
        currency: 'ETB',
        customerName: data.contactPersonName,
        customerPhoneNumber: data.contactPersonPhone,
        items: _items,
        callbackURL: 'https://example.com/start_pay_callback',
        expiredAt,
        redirectUrl: 'http://localhost:3001',
        metadata: {
          order_reference: 'ORD-2025-001',
          custom_field: 'any value',
        },
      },
      {
        headers: {
          'x-api-secret': process.env.STARPAY_API_KEY,
        },
      },
    );

    return result.data;
  }
}
