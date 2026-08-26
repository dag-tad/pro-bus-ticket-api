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
import { CancellationPolicyService } from './cancellation-policy.service';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CancellationPolicyTierDTO, CreateCancellationPolicyDTO } from 'src/dto/cancellation-policy-tier.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/entity/user.entity';
import { RequireAccess } from 'src/decorators/access.decorator';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { AccessTokenJWTGuard } from 'src/auth/guard/access-token-jwt.guard';
import { AccessGuard } from 'src/auth/guard/access.guard';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { PaginationDto } from 'src/dto/pagination.dto';
import { CancellationPolicy } from 'src/entity/cancellation-policy.entity';
import { UpdateCancellationPolicyDTO } from 'src/dto/update-cancellation-policy.dto';

@Controller('cancellation-policy')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class CancellationPolicyController {
  constructor(private service: CancellationPolicyService) {}

  @ApiOperation({ summary: 'fetch cancellation policies' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('paginate')
  async findAllCancellationPolicies(
    @CurrentUser() user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto,
  ) {
    const companyId = user.companyId ? user.companyId : options.companyId;
    return await this.service.findAllCancellationPolicies(
      options,
      companyId
    );
  }

  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Cancellation policy detail' })
  @ApiParam({ name: 'id', description: 'policy id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Policy detail fetched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found.',
  })
  @Get('detail/:id')
  async getBusModelById(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: CancellationPolicy }> {
    const companyId = user.companyId;

    const result = await this.service.getCancellationPolicyById(id, companyId);

    if (!result) {
      throw new NotFoundException(`Policy with id = ${id} not found.`);
    }

    return { data: result };
  }

  @Post('create')
  @ApiOperation({ summary: 'Create cancellation polic' })
  @ApiBody({
    type: CreateCancellationPolicyDTO,
    description: 'Create cancellation policy',
  })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiResponse({
    status: 201,
    description: 'Cancellation policy created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createCancellationPolicy(
    @Body() data: CreateCancellationPolicyDTO,
    @CurrentUser() user: User,
  ) {
    const companyId = user.companyId ? user.companyId : data.companyId;
    const result = await this.service.createCancellationPolicy({
      ...data,
      companyId,
    });

    return result;
  }

  @Patch('edit/:id')
    @RequireAccess(
      [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
      [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
    )
    @ApiOperation({ summary: 'Update cancellation policy for a company' })
    @ApiBody({
      type: CancellationPolicyTierDTO,
      description: 'Update cancellation policy for a company',
    })
    @ApiResponse({ status: 201, description: 'Cancellation policy updated successfully' })
    @ApiResponse({ status: 400, description: 'Cancellation policy request' })
    async updateCancellationPolicy(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: User,
      @Body() data: { tiers: CancellationPolicyTierDTO[], companyId?: string | null | undefined },
    ) {
      let companyId: string | undefined | null = null
      
      if (user.companyId){
        companyId = user.companyId
      } else {
        companyId = data.companyId!
      }
      
      return await this.service.updateCancellationPolicy({
        companyId,
        id,
        tiers: data.tiers,
      });
    }
}
