import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { CreateUserDTO } from 'src/dto/create-user.dto';
import { UpdateUserDTO } from 'src/dto/update-user.dto ';

@Controller('user')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: 'Create user' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Post('create')
  async createUser(@CurrentUser() user: User, @Body() data: CreateUserDTO) {
    const companyId = user.companyId ? user.companyId : data.companyId;
    const createdById = user.id;
    return await this.userService.createUser({ createdById, data, companyId });
  }

  @ApiOperation({ summary: 'Create user' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Patch('edit/:id')
  async updateUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User, @Body() data: UpdateUserDTO) {
    // const companyId = user.companyId ? user.companyId : data.companyId;
    const updatedById = user.id;
    return await this.userService.updateateUser({ id, data });
  }

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
    const companyId = user.companyId ? user.companyId : options.companyId;
    return await this.userService.findAll({ options, companyId });
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
    const companyId = user.companyId ? user.companyId : options.companyId;
    return await this.userService.countUsers(companyId);
  }

  @ApiOperation({ summary: 'count users' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get(':id')
  async getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.getUserDetail(id);
  }

  @ApiOperation({ summary: 'update user status' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Patch('status/:id')
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return await this.userService.updateUserStatus(id, user.id);
  }
}
