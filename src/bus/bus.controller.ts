import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBusModelDTO } from 'src/dto/bus-model.dto';
import { CreateBusDTO } from 'src/dto/create-bus.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';

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
  @RequireAccess([REALM.SUPER_ADMIN, REALM.TRANSPORT_COMPANY], [ROLE.ADMIN])
  @Post('model/create')
  async createBusModel(@Body() model: CreateBusModelDTO): Promise<any> {
    return this.busService.createBusModel(model);
  }

  @Post('create')
  @RequireAccess([REALM.SUPER_ADMIN, REALM.TRANSPORT_COMPANY], [ROLE.ADMIN])
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
