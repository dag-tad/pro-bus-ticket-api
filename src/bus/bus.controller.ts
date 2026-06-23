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

@ApiTags('bus')
@ApiBearerAuth('accessToken')
@Controller('bus')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class BusController {
  constructor(private busService: BusService) {}

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
  @Get('model/paginate')
  async findAll(@Query(new NormalizeQueryPipe()) options: PaginationDto) {
    return await this.busService.findAllModels(options);
  }

  @RequireAccess([REALM.SYSTEM], [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN])
  @ApiOperation({ summary: 'Bus model detail' })
  @ApiParam({ name: 'id', description: 'Model id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Bus model detail fetched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Bus model not found.'
  })
  @Get('model/:id')
  async getCompanyById(
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
  async addModelForCompany(
    @CurrentUser('sub') id: any,
    @Body() data: CreateBusDTO,
  ) {
    return await this.busService.create(data);
  }
}
