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
import { RouteService } from './route.service';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Route } from 'src/entity/route.entity';

@ApiTags('route')
@ApiBearerAuth('accessToken')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
@Controller('routes')
export class RouteController {
  constructor(private service: RouteService) {}

  @ApiOperation({ summary: 'fetch routes' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('paginate')
  async paginate(
    @CurrentUser('userId') user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto,
  ) {
    return await this.service.getRoutes(options);
  }

  @ApiOperation({ summary: 'count users' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('count')
  async countUsers() {
    return await this.service.countRoutes();
  }

  @ApiOperation({ summary: 'route detail' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get(':id')
  async getRouteDetail(@Param('id', ParseUUIDPipe) id: string) {
    return await this.service.getRouteDetail(id);
  }

  @Post('create')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Create route for a company' })
  @ApiBody({
    type: CreateRouteDto,
    description: 'Create a new route from an existing model',
  })
  @ApiResponse({ status: 201, description: 'Route created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createRoute(@CurrentUser() user: User, @Body() data: CreateRouteDto) {
    const _user = user as unknown as any;
    const companyId = user.companyId ? user.companyId : data.companyId;

    const result = await this.service.create({
      userId: _user.userId,
      companyId: companyId!,
      route: data,
    });
    
    return result
  }

  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Toggle route status' })
  @ApiParam({ name: 'id', description: 'route id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Route status changed successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Route not found.',
  })
  @Patch('status/:id')
  async toggleRouteStatus(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Route | null> {
    return await this.service.toggleRouteStatus(id, userId);
  }

  @Patch(':id')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Update route for a company' })
  @ApiBody({
    type: CreateRouteDto,
    description: 'Update a new route from an existing model',
  })
  @ApiResponse({ status: 200, description: 'Route updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() data: CreateRouteDto,
  ) {
    const _user = user as unknown as any;
    const companyId = user.companyId ? user.companyId : data.companyId;

    return await this.service.update({
      userId: _user.userId,
      id,
      route: data,
    });
  }
}
