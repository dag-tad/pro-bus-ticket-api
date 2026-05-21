import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransportCompanyDTO } from 'src/dto/create-transport-company.dto';
import { TransportCompany } from '../entity/transport-company.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { ImageUploader } from './cloudinary.config';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { CompanyStatus } from 'src/enums/transport-company.enum';

@Injectable()
export class TransportCompanyService {
  constructor(
    private readonly imageUploader: ImageUploader,
    @InjectRepository(TransportCompany)
    private repo: Repository<TransportCompany>,
  ) {}

  async findAll(
    @Query() options: PaginationDto,
  ): Promise<PaginatedResponse<TransportCompany>> {
    const { page, limit, search, sortBy, sortOrder } = options;
    const skip = (page! - 1) * limit!;

    const queryBuilder = this.repo.createQueryBuilder('transport_companies');

    if (search) {
      queryBuilder.where(
        'transport_companies.name ILIKE :search OR transport_companies.tradeName ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    const [data, totalItems] = await queryBuilder
    .orderBy(`transport_companies.${sortBy}`, sortOrder)
    .skip(skip)
    .take(limit)
    .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit!);
    const hasNextPage = page! < totalPages;
    const hasPreviousPage = page! > 1;

    return {
      data,
      meta: {
        limit: limit!,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        page: page!,
      },
    };
  }

  async create(file: Express.Multer.File, data: CreateTransportCompanyDTO) {
    try {
      const existingCompany = await this.repo.find({
        where: [
          {
            licenseNumber: data.licenseNumber,
          },
          { name: data.name },
        ],
      });

      if (existingCompany.length > 0) {
        return new BadRequestException({
          description: 'name and licence number must be unique',
        });
      }
      const uploadedImage = await this.imageUploader.uploadImage(file.path);

      await fs.promises.unlink(file.path);

      const _data = {
        ...data,
        logoUrl: uploadedImage.url,
      };
      const company = this.repo.create(_data);

      const result = await this.repo.save({
        ...company,
        createdAt: new Date(),
      });

      return result;
    } catch (error) {
      return new InternalServerErrorException(error);
    }
  }

  async updateStatus(id: string, status: CompanyStatus): Promise<{ success: boolean, message: string }> {
    const result = await this.repo.update(id, {
      status
    })

    if (result.affected && result.affected > 0) {
      return { success: true, message: "'Company status updated successfully"}
    }

    return { success: false, message: "Company status update failed"}
  }
}
