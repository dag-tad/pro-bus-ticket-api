import {
  BadRequestException,
  Body,
  Controller,
  Get,
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

@ApiTags('transport-company')
@Controller('transport-company')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class TransportCompanyController {
  constructor(private readonly service: TransportCompanyService) {}

  @RequireAccess([REALM.SUPER_ADMIN, REALM.TRANSPORT_COMPANY], [ROLE.ADMIN])
  @Get()
  async findAll(@Query() options: PaginationDto) {
    return await this.service.findAll(options);
  }

  @Post()
  @RequireAccess([REALM.SUPER_ADMIN, REALM.TRANSPORT_COMPANY], [ROLE.ADMIN])
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
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateTransportCompanyDTO,
  ) {
    const result = await this.service.create(file, body);

    return result;
  }
}
