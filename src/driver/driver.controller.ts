import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenJWTGuard } from 'src/auth/guard/access-token-jwt.guard';
import { AccessGuard } from 'src/auth/guard/access.guard';
import { RequireAccess } from 'src/decorators/access.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { CreateRouteDto } from 'src/dto/create-route.dto';
import { User } from 'src/entity/user.entity';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Route } from 'src/entity/route.entity';
import { DriverService } from './driver.service';
import { CreateDriverDTO } from 'src/dto/create-driver.dto';
import { AssignDriverToBusDTO } from 'src/dto/assign-driver-to-bus.dto';
import { Driver } from 'src/entity/driver.entity';
import { DriverStatus } from 'src/enums/driver-status.enum';
import { UpdateDriverStatusSchema } from 'src/dto/update-driver-status.dto';

@ApiTags('drivers')
@ApiBearerAuth('accessToken')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
@Controller('drivers')
export class DriverController {
  constructor(private service: DriverService) {}

  @ApiOperation({ summary: 'fetch drivers' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('paginate')
  async paginate(
    @CurrentUser() user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto,
  ) {
    const _user = user as unknown as any;
    const result = await this.service.paginate(_user.companyId!, options);

    const _result = result.data.map((item: any) => {
      return {
        id: item.id,
        userId: item.userId,
        licenseNumber: item.licenseNumber,
        licenseClass: item.licenseClass,
        status: item.status,
        drivingLicensIssuedOn: item.drivingLicensIssuedOn,
        drivingLicenseExpresOn: item.drivingLicenseExpresOn,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        email: item.user.email,
        phone: item.user.phone,
        profilePictureUrl: item.profilePictureUrl,
        assignedBus: item.assignedBus,
      };
    });

    return { data: _result, meta: result.meta };
  }

  @ApiOperation({ summary: 'count drivers' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('count')
  async countDrivers() {
    // return await this.service.countRoutes();
  }

  @ApiOperation({ summary: 'driver detail' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get(':id')
  async getDriverDetail(@Param('id', ParseUUIDPipe) id: string) {
    // return await this.service.detail(id);
  }

  @Post('create')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Create driver for a company' })
  @ApiBody({
    type: CreateDriverDTO,
    description: 'Create a new driver from an existing company',
  })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createDriver(@CurrentUser() user: User, @Body() data: CreateDriverDTO) {
    const _user = user as unknown as any;

    // const companyId = user.companyId ? user.companyId : data.companyId;
    return await this.service.createDriver(_user.userId, _user.companyId, data);
  }

  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Driver detail' })
  @ApiParam({ name: 'id', description: 'Model id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Driver fetched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Driver not found.',
  })
  @Get('detail/:id')
  async getDriverById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: any }> {
    const result = await this.service.getDriverById(id);

    if (!result) {
      throw new NotFoundException(`Driver with id = ${id} not found.`);
    }

    const activeBusAssignment = result.driverBuses?.find(
      (db) => db.isActive === true,
    );

    return {
      data: {
        id: result.id,
        companyId: result.companyId,
        userId: result.userId,
        licenseNumber: result.licenseNumber,
        licenseClass: result.licenseClass,
        status: result.status,
        drivingLicensIssuedOn: result.drivingLicensIssuedOn,
        drivingLicenseExpresOn: result.drivingLicenseExpresOn,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        assignedBus: activeBusAssignment,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        phone: result.user.phone,
        gender: result.user.gender,
        profilePictureUrl: result.user.profilePictureUrl,
      },
    };
  }

  @Post('assign-bus/:id')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Assign a driver to a bus' })
  @ApiBody({
    type: AssignDriverToBusDTO,
    description: 'Assign a driver to a bus',
  })
  @ApiResponse({ status: 201, description: 'Driver assigned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async assignBus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: AssignDriverToBusDTO,
  ) {
    return await this.service.assignDriverToBus({...data, driverId: id});
  }

  @Patch('status/:id')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Update driver status' })
  @ApiBody({
    type: UpdateDriverStatusSchema,
    description: 'Update driver status',
  })
  @ApiResponse({ status: 201, description: 'Driver status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateDriverStatusSchema,
  ) {
    const _user = user as unknown as any
    const companyId = _user.companyId
    
    return await this.service.updateStatus({companyId, driverId: id, status: data.status as DriverStatus });
  }
}
