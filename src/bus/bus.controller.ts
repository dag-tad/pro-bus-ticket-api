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
import { BusService } from './bus.service';
import { AccessGuard } from '../auth/guard/access.guard';
import { AccessTokenJWTGuard } from '../auth/guard/access-token-jwt.guard';
import { RequireAccess } from '../decorators/access.decorator';
import { REALM } from '../enums/realm.enum';
import { ROLE } from '../enums/role.enum';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBusModelDTO } from 'src/dto/bus-model.dto';
import { CreateBusDTO } from 'src/dto/create-bus.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { PaginationDto } from 'src/dto/pagination.dto';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { BusModel } from 'src/entity/bus-model.entity';
import { User } from 'src/entity/user.entity';
import { Bus } from 'src/entity/bus.entity';
import { DuplicateBusDTO } from 'src/dto/duplicate-bus.dto';
import { UpdateBusDTO } from 'src/dto/update-bus.dto';
import { UpdateBusStatusDto } from 'src/dto/update-bus-status.dto';

@ApiTags('bus')
@ApiBearerAuth('accessToken')
@Controller('bus')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class BusController {
  constructor(private busService: BusService) {}

  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Bus detail' })
  @ApiParam({ name: 'id', description: 'Bus id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Bus detail fetched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Bus not found.',
  })
  @Get('detail/:id')
  async getBusById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: Bus }> {
    const result = await this.busService.getBusById(id);

    if (!result) {
      throw new NotFoundException(`Bus with id = ${id} not found.`);
    }

    return { data: result };
  }

  @ApiOperation({ summary: 'Create bus model' })
  @ApiBody({
    type: CreateBusModelDTO,
  })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Post('model/create')
  async createBusModel(
    @CurrentUser('userId') id: string,
    @Body() model: any,
  ): Promise<any> {
    return this.busService.createBusModel(model, id);
  }

  @ApiOperation({ summary: 'Toggle bus model' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Patch('model/toggle-status/:id')
  async toggleBusModelStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<any> {
    return await this.busService.toggleBusModelStatus(id, userId);
  }

  @ApiOperation({ summary: 'Update bus model' })
  @ApiBody({
    type: CreateBusModelDTO,
  })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Patch('model/:id')
  async updateBusModel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @Body() model: any,
  ): Promise<any> {
    return this.busService.updateBusModel(id, model, userId);
  }

  @ApiOperation({ summary: 'fetch bus models' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('paginate')
  async findAllBusses(@CurrentUser('userId') user: User, @Query(new NormalizeQueryPipe()) options: PaginationDto) {
    return await this.busService.findAllBusses(options, user.companyId);
  }

  @ApiOperation({ summary: 'fetch bus models' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('model/paginate')
  async findAll(@Query(new NormalizeQueryPipe()) options: PaginationDto) {
    return await this.busService.findAllModels(options);
  }

  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Bus model detail' })
  @ApiParam({ name: 'id', description: 'Model id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Bus model detail fetched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Bus model not found.',
  })
  @Get('model/:id')
  async getBusModelById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: BusModel }> {
    const result = await this.busService.getBusModelById(id);

    if (!result) {
      throw new NotFoundException(`Bus model with id = ${id} not found.`);
    }

    return { data: result };
  }

  @Post('create')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Create bus for a company' })
  @ApiBody({
    type: CreateBusDTO,
    description: 'Create a new bus from an existing model',
  })
  @ApiResponse({ status: 201, description: 'Bus created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBus(
    @CurrentUser() user: User,
    @Body() data: CreateBusDTO,
  ) {
    const _user = user as unknown as any;
    const companyId = user.companyId ? user.companyId : data.companyId;
    
    return await this.busService.create({
      userId: _user.userId,
      bus: data,
      companyId: companyId!,
    });
  }

  @Patch(':id')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Update bus for a company' })
  @ApiBody({
    type: UpdateBusDTO,
    description: 'Update bus for a company',
  })
  @ApiResponse({ status: 201, description: 'Bus updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateBus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() data: UpdateBusDTO,
  ) {
    const _user = user as unknown as any;
    let companyId: string | null = null
    
    if (user.companyId){
      companyId = user.companyId
    } else {
      companyId = data.companyId!
    }
    
    return await this.busService.update({
      id,
      userId: _user.userId,
      bus: data,
      companyId,
    });
  }

  @Post('duplicate')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Duplicate bus' })
  @ApiBody({
    type: DuplicateBusDTO,
    description: 'Duplicate a bus',
  })
  @ApiResponse({ status: 201, description: 'Bus duplicated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async duplicateBus(
    @CurrentUser() user: User,
    @Body() data: DuplicateBusDTO,
  ) {
    const _user = user as unknown as any;
    const companyId = user.companyId ? user.companyId : data.companyId;
    return await this.busService.duplicateBus({
      userId: _user.userId,
      bus: data,
      companyId: companyId!,
    });
  }
  
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Toggle bus status' })
  @ApiParam({ name: 'id', description: 'Bus id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Bus status changed successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Bus not found.',
  })
  @Patch('status/:id')
  async toggleBus(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateBusStatusDto
  ): Promise<{ data: Bus }> {
    const result = await this.busService.toggleBusStatus(id, userId, data.status);

    if (!result) {
      throw new NotFoundException(`Bus with id = ${id} not found.`);
    }

    return { data: result };
  }
}
