import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CreateBookingDTO } from 'src/dto/create-booking.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { BookingPassenger } from 'src/entity/booking-passenger.entity';
import { Booking } from 'src/entity/booking.entity';
import { Passenger } from 'src/entity/passenger.entity';
import { TripSeat } from 'src/entity/trip-seat.entity';
import { Trip } from 'src/entity/trip.entity';
import { BookingStatus } from 'src/enums/booking-status.enum';
import { BookingType } from 'src/enums/booking-type.enum';
import { TripSeatStatus } from 'src/enums/trip-seat-status.enum';
import { TripStatus } from 'src/enums/trip-status.enum';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Trip) private repo: Repository<Trip>,
    private readonly dataSource: DataSource,
  ) {}

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
    await this.dataSource.transaction(async (manager) => {
      // 1. Find expired bookings
      const expiredBookings = await manager
        .getRepository(Booking)
        .createQueryBuilder('booking')
        .where('booking.status = :status', {
          status: BookingStatus.PENDING,
        })
        .andWhere('booking.expiresAt <= NOW()')
        .getMany();

      for (const booking of expiredBookings) {
        // 2. Get the seats held by this booking
        const bookingPassengers = await manager
          .getRepository(BookingPassenger)
          .find({
            where: {
              bookingId: booking.id,
            },
          });

        // 3. Release the seats
        for (const bookingPassenger of bookingPassengers) {
          await manager
            .getRepository(TripSeat)
            .createQueryBuilder()
            .update()
            .set({
              status: TripSeatStatus.AVAILABLE,
            })
            .where('id = :id', {
              id: bookingPassenger.tripSeatId,
            })
            .andWhere('status = :status', {
              status: TripSeatStatus.HELD,
            })
            .execute();
        }

        // 4. Delete BookingPassenger rows
        await manager.getRepository(BookingPassenger).delete({
          bookingId: booking.id,
        });

        // 5. Mark booking expired
        await manager.getRepository(Booking).update(
          {
            id: booking.id,
          },
          {
            status: BookingStatus.EXPIRED,
            cancellationTime: new Date(),
            cancellationReason: 'Payment timeout',
          },
        );

        // 6. Update trip availability
        const passengerCount = bookingPassengers.length;

        await manager
          .getRepository(Trip)
          .createQueryBuilder()
          .update()
          .set({
            availableSeats: () => `"availableSeats" + ${passengerCount}`,
          })
          .where('id = :tripId', {
            tripId: booking.tripId,
          })
          .execute();
      }
    });
    const trip = await this.repo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.company', 'company')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('trip.bus', 'bus')
      .leftJoinAndSelect('bus.model', 'model')
      .leftJoinAndSelect('trip.originCity', 'originCity')
      .leftJoinAndSelect('trip.destinationCity', 'destinationCity')
      .leftJoinAndSelect('trip.originTerminal', 'originTerminal')
      .leftJoinAndSelect('trip.tripSeats', 'tripSeats')
      .leftJoinAndSelect('trip.destinationTerminal', 'destinationTerminal')
      .where('trip.id = :id', { id })
      .getOne();

    if (!trip) {
      throw new NotFoundException('Invalid trip selected.');
    }

    const _trip = { ...trip } as unknown as any;
    _trip.tripSeats = trip.tripSeats.map((seat: TripSeat) => {
      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        status: seat.status,
      };
    });

    return _trip;
  }

  async createBooking(data: CreateBookingDTO) {
    try {
      if (!data.passengers || data.passengers.length === 0) {
        throw new BadRequestException('At least one passenger is required');
      }

      const seatNumbers = data.passengers.map(
        (passenger) => passenger.seatNumber,
      );

      const uniqueSeatNumbers = new Set(seatNumbers);

      if (uniqueSeatNumbers.size !== seatNumbers.length) {
        throw new ConflictException(
          'The same seat cannot be selected more than once',
        );
      }

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

      if (
        trip.status === TripStatus.CANCELLED ||
        trip.status === TripStatus.COMPLETED
      ) {
        throw new ConflictException(
          'This trip is no longer available for booking',
        );
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
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

      const booking = await this.dataSource.transaction(async (manager) => {
        const requestedPassengers = [...data.passengers].sort((a, b) =>
          a.seatNumber.localeCompare(b.seatNumber),
        );

        const lockedSeats: TripSeat[] = [];

        // i don't think this is efficient
        for (const passenger of requestedPassengers) {
          const tripSeat = await manager.findOne(TripSeat, {
            where: {
              tripId: trip.id,
              seatNumber: passenger.seatNumber,
              status: TripSeatStatus.AVAILABLE,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          });

          if (!tripSeat) {
            throw new BadRequestException(
              `Seat ${passenger.seatNumber} does not exist on this trip`,
            );
          }

          lockedSeats.push(tripSeat);
        }
        
        // fee calculation can be changed based on the discussion I will have with the team
        const farePerPassenger = Number(trip.currentFare ?? trip.baseFare);
        const platformFeePerPassenger = 7.5;

        const fare = farePerPassenger * requestedPassengers.length;

        const platformFee =
          (platformFeePerPassenger / 100) * fare;

        const totalAmount = fare + platformFee;

        // create booking
        const newBooking = manager.create(Booking, {
          bookingType: BookingType.SELF,
          status: BookingStatus.PENDING,
          fare,
          platformFee,
          totalAmount,
          bookingTime: now,
          expiresAt,
          tripId: trip.id,
        });

        const savedBooking = await manager.save(Booking, newBooking);

        for (let i = 0; i < requestedPassengers.length; i++) {
          const passengerData = requestedPassengers[i];

          const tripSeat = lockedSeats[i];

          const _passenger = await manager.create(Passenger, {
            phoneNumber: passengerData.phone,
            fullName: passengerData.fullName,
            idNumber: passengerData.idNumber,
          });

          const passenger = await manager.save(Passenger, _passenger);

          const bookingPassenger = manager.create(BookingPassenger, {
            bookingId: savedBooking.id,
            passengerId: passenger.id,
            tripSeatId: tripSeat.id,
            seatNumber: passengerData.seatNumber,
            fare: farePerPassenger,
            platformFee: platformFeePerPassenger,
            totalAmount: farePerPassenger + platformFeePerPassenger,
            isBoarded: false,
          });

          await manager.save(BookingPassenger, bookingPassenger);

          // ---------------------------------------------------
          // Hold the seat
          // ---------------------------------------------------

          tripSeat.status = TripSeatStatus.HELD;

          await manager.save(TripSeat, tripSeat);

          trip.availableSeats = Math.max(
            0,
            Number(trip.availableSeats) - requestedPassengers.length,
          );

          await manager.save(Trip, trip);
        }

        const result = await axios.post(
          process.env.STARPAY_PAYMENT_URL!,
          {
            amount: trip.baseFare * data.passengers.length,
            description: `${trip.originCity.cityName} -> ${trip.destinationCity.cityName}`,
            currency: 'ETB',
            customerName: data.contactPersonName,
            customerPhoneNumber: data.contactPersonPhone,
            items: _items,
            callbackURL: 'https://example.com/start_pay_callback',
            expiredAt: expiresAt,
            redirectUrl: 'http://localhost:3001',
            metadata: {
              order_reference: 'ORD-2025-00124',
              custom_field: 'any value',
            },
          },
          {
            headers: {
              'x-api-secret': process.env.STARPAY_API_KEY,
            },
          },
        );

        await manager.update(
          Booking,
          { id: savedBooking.id },
          { orderNumber: result.data.data.order_id },
        );

        return result.data;
      });
      return booking;
    } catch (error) {
      console.log(JSON.stringify(error, null, 2))
      throw new BadGatewayException(
        'Unable to initiate payment. Please try again.',
      );
    }
  }
}
