import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { Trip } from 'src/entity/trip.entity';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { PaginationDto } from 'src/dto/pagination.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateBookingDTO } from 'src/dto/create-booking.dto';

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

  @Get('detail/:id')
  async getTripDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: Trip[] }> {
    const result = await this.service.getTripDetail(id);

    if (!result) {
      throw new NotFoundException(`Trip not found.`);
    }

    return { data: result };
  }

  @Post('create')
  @ApiOperation({ summary: 'Make booking' })
  @ApiBody({
    type: CreateBookingDTO,
    description: 'Make booking',
  })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTrip(@Body() data: CreateBookingDTO) {
    const result = await this.service.createBooking(data)

    return result
  }
}
