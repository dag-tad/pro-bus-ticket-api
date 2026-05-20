import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
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

@ApiTags('transport-company')
@Controller('transport-company')
export class TransportCompanyController {
  constructor(private readonly service: TransportCompanyService) {}
  @Get()
  list() {
    return 'hello';
  }

  @Post()
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
    const result = await this.service.create(file, body)

    return result
  }
}
