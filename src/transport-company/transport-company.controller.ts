import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateTransportCompanyDTO } from 'src/dto/create-transport-company.dto';

import { TransportCompanyService } from './transport-company.service';
import { AccessTokenJWTGuard } from 'src/auth/guard/access-token-jwt.guard';
import { AccessGuard } from 'src/auth/guard/access.guard';
import { RequireAccess } from 'src/decorators/access.decorator';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { PaginationDto } from 'src/dto/pagination.dto';
import { UpdateTransportCompanyStatusDTO } from 'src/dto/update-transport-company-status.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { NormalizeQueryPipe } from 'src/pipes/normalize-query.pipe';
import { TransportCompany } from 'src/entity/transport-company.entity';

@ApiTags('transport-company')
@Controller('transport-company')
@ApiBearerAuth('accessToken')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class TransportCompanyController {
  constructor(private readonly service: TransportCompanyService) {}

  @RequireAccess([REALM.SYSTEM, REALM.TRANSPORT_COMPANY], [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN])
  @Get()
  async findAll(@Query(new NormalizeQueryPipe()) options: PaginationDto) {
    return await this.service.findAll(options);
  }

  @Get(':id')
  @RequireAccess([REALM.SYSTEM], [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN])
  @ApiOperation({ summary: 'Company detail' })
  @ApiParam({ name: 'id', description: 'Company ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Company detail fetched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found.',
  })
  async getCompanyById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: TransportCompany }> {
    const result = await this.service.getCompanyById(id);

    if (!result) {
      throw new NotFoundException(`Company with id = ${id} not found.`)
    }

    return { data: result }
  }

  @Patch(':id')
  @RequireAccess([REALM.SYSTEM], [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN])
  @ApiOperation({ summary: 'Update company status' })
  @ApiBody({
    type: UpdateTransportCompanyStatusDTO,
  })
  @ApiParam({ name: 'id', description: 'Company ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Company status updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Company status updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    schema: {
      example: { success: false, message: 'Company status update failed' },
    },
  })

  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: UpdateTransportCompanyStatusDTO,
  ): Promise<{ success: boolean; message: string }> {
    const { status } = statusDto;
    return await this.service.updateStatus(id, status);
  }

  @Post()
  @RequireAccess([REALM.SYSTEM, REALM.TRANSPORT_COMPANY], [ROLE.SUPER_ADMIN, ROLE.COMPANY_ADMIN])
  @ApiOperation({ summary: 'Create transport company' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateTransportCompanyDTO,
    description: 'Company information with logo',
  })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async create(
    @CurrentUser('sub') id: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateTransportCompanyDTO,
  ) {
    const result = await this.service.create(id, file, body);

    return result;
  }
}
