import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { Trip } from 'src/entity/trip.entity';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { PaginationDto } from 'src/dto/pagination.dto';

@Controller('booking')
export class BookingController {
  constructor(private service: BookingService) {}

  @Get('search')
  async searchTrip(
    @Query(new NormalizeQueryPipe())
    options: {
      departureCityId: string;
      arrivalCityId: string;
      departureDate: string;
    },
  ): Promise<{ data: Trip[] }> {
    const result = await this.service.searchTrips(options);

    if (!result) {
      throw new NotFoundException(`Trip not found.`);
    }

    return { data: result };
  }
}
