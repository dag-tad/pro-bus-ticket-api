import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { RequireAccess } from 'src/decorators/access.decorator';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/entity/user.entity';
import { CreateTerminalDTO } from 'src/dto/create-terminal.dto';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Terminal } from 'src/entity/terminal.entity';
import { UpdateTerminalDTO } from 'src/dto/update-terminal.dto';

@Controller('terminals')
export class TerminalsController {
  constructor(private service: TerminalsService) {}

  @ApiOperation({ summary: 'fetch terminals' })
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @Get('paginate')
  async findAllTerminals(
    @CurrentUser('userId') user: User,
    @Query(new NormalizeQueryPipe()) options: PaginationDto,
  ) {
    return await this.service.findAllTerminals(options);
  }
  
  @RequireAccess(
      [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
      [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
    )
    @ApiOperation({ summary: 'Terminal detail' })
    @ApiParam({ name: 'id', description: 'Terminal id', type: String })
    @ApiResponse({
      status: 200,
      description: 'Terminal detail fetched successfully.',
    })
    @ApiResponse({
      status: 404,
      description: 'Terminal not found.',
    })
    @Get('detail/:id')
    async getBusById(
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{ data: Terminal }> {
      const result = await this.service.getTerminalById(id);
  
      if (!result) {
        throw new NotFoundException(`Terminal with id = ${id} not found.`);
      }
  
      return { data: result };
    }

  @Post('create')
  @RequireAccess(
    [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
    [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
  )
  @ApiOperation({ summary: 'Create terminal' })
  @ApiBody({
    type: CreateTerminalDTO,
    description: 'Create a new terminal from an existing model',
  })
  @ApiResponse({ status: 201, description: 'Terminal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTerminal(
    @CurrentUser() user: User,
    @Body() data: CreateTerminalDTO,
  ) {
    return await this.service.create(data);
  }

  @Patch(':id')
    @RequireAccess(
      [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
      [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
    )
    @ApiOperation({ summary: 'Update terminal for a company' })
    @ApiBody({
      type: UpdateTerminalDTO,
      description: 'Update terminal for a company',
    })
    @ApiResponse({ status: 201, description: 'Terminal updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async updateTerminal(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: User,
      @Body() data: UpdateTerminalDTO,
    ) {
      return await this.service.update(id, data);
    }

    @RequireAccess(
        [REALM.SYSTEM, REALM.TRANSPORT_COMPANY],
        [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN],
      )
      @ApiOperation({ summary: 'Toggle terminal status' })
      @ApiParam({ name: 'id', description: 'Terminal id', type: String })
      @ApiResponse({
        status: 200,
        description: 'Terminal status changed successfully.',
      })
      @ApiResponse({
        status: 404,
        description: 'Terminal not found.',
      })
      @Patch('status/:id')
      async toggleTerminalStatus(
        @Param('id', ParseUUIDPipe) id: string,
      ): Promise<{ data: Terminal }> {
        const result = await this.service.toggleTerminalStatus(id);
    
        if (!result) {
          throw new NotFoundException(`Terminal with id = ${id} not found.`);
        }
    
        return { data: result };
      }
}
