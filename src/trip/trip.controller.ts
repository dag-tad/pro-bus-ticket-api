import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

@ApiTags('trip')
@ApiBearerAuth('accessToken')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
@Controller('trip')
export class TripController {
  constructor(private service: TripService) {}

  @ApiOperation({ summary: 'fetch busses' })
    @RequireAccess(
      [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
      [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
    )
  @Get('busses')
  async getBusses(
    @CurrentUser() user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto,
  ) {
    return await this.service.findAll(options, user.companyId);
  }
}
