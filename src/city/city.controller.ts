import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CityService } from './city.service';
import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAccess } from 'src/decorators/access.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { CreateBusDTO } from 'src/dto/create-bus.dto';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { CreateCityDTO } from 'src/dto/create-city.dto';
import { AccessTokenJWTGuard } from 'src/auth/guard/access-token-jwt.guard';
import { AccessGuard } from 'src/auth/guard/access.guard';
import { PaginationDto } from 'src/dto/pagination.dto';

@ApiTags('City')
@ApiBearerAuth('accessToken')
@Controller('cities')
export class CityController {
  constructor(private service: CityService) {}

  @Get()
  async findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    options: PaginationDto,
  ) {
    return await this.service.findAll(options);
  }

  @Post('create')
  @UseGuards(AccessTokenJWTGuard, AccessGuard)
  @RequireAccess([REALM.SUPER_ADMIN, REALM.TRANSPORT_COMPANY], [ROLE.ADMIN])
  @ApiOperation({ summary: 'Create city' })
  @ApiBody({
    type: CreateCityDTO,
    description: 'Create a city in which transport companies operate',
  })
  @ApiResponse({ status: 201, description: 'City created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addModelForCompany(
    @CurrentUser('sub') id: any,
    @Body() data: CreateCityDTO,
  ) {
    return await this.service.create(id, data);
  }
}
