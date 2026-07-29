import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenJWTGuard } from 'src/auth/guard/access-token-jwt.guard';
import { AccessGuard } from 'src/auth/guard/access.guard';
import { TripService } from './trip.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/entity/user.entity';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { PaginationDto } from 'src/dto/pagination.dto';
import { RequireAccess } from 'src/decorators/access.decorator';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { CreateTripDTO } from 'src/dto/create-trip.dto';

@ApiTags('trip')
@ApiBearerAuth('accessToken')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
@Controller('trip')
export class TripController {
  constructor(private service: TripService) {}

  @ApiOperation({ summary: 'fetch trips' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('paginate')
  async getTrips(
    @CurrentUser() user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto,
  ) {
    return await this.service.findAllTrips(options, user.companyId);
  }

  @ApiOperation({ summary: 'fetch busses' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('busses')
  async getBusses(
    @CurrentUser() user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto & { departureDate: string },
  ) {
    const _user = user as unknown as any;
    const companyId = _user.companyId ? _user.companyId : _user.companyId;

    return await this.service.findAllBusses(options, companyId);
  }

  @ApiOperation({ summary: 'fetch trip detail' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get(':id')
  async getTripDetail(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string,) {
    const _user = user as unknown as any;
    const companyId = user.companyId ? _user.companyId : _user.companyId;

    return await this.service.getDetail(id, companyId!);
  }

  @ApiOperation({ summary: 'fetch trip stat' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    const _user = user as unknown as any;
    const companyId = user.companyId ? _user.companyId : _user.companyId;

    return await this.service.getStats(companyId!);
  }

  @Post('create')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Create trip for a company' })
  @ApiBody({
    type: CreateTripDTO,
    description: 'Create a new trip for a company',
  })
  @ApiResponse({ status: 201, description: 'Trip created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTrip(@CurrentUser() user: User, @Body() data: CreateTripDTO) {
    const _user = user as unknown as any;
    const companyId = user.companyId ? user.companyId : user.companyId;

    return await this.service.create({
      userId: _user.userId,
      trip: data,
      companyId: companyId!,
    });
  }
}
