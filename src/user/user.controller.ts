import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation } from '@nestjs/swagger';
import { RequireAccess } from 'src/decorators/access.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { PaginationDto } from 'src/dto/pagination.dto';
import { User } from 'src/entity/user.entity';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { AccessTokenJWTGuard } from 'src/auth/guard/access-token-jwt.guard';
import { AccessGuard } from 'src/auth/guard/access.guard';

@Controller('user')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: 'fetch users' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('paginate')
  async findAllBusses(
    @CurrentUser() user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto,
  ) {
    const companyId = user.companyId ? user.companyId : options.companyId
    return await this.userService.findAll({options, companyId});
  }

  @ApiOperation({ summary: 'count users' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('count')
  async countUsers(
    @CurrentUser() user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto,
  ) {
    const companyId = user.companyId ? user.companyId : options.companyId
    return await this.userService.countUsers(companyId);
  }

  @ApiOperation({ summary: 'count users' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get(':id')
  async getUserDetail(
     @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.userService.getUserDetail(id);
  }
}
