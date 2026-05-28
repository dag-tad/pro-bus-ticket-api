import {
    ConflictException,
  Injectable,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCityDTO } from 'src/dto/create-city.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { City } from 'src/entity/cities.entity';
import { User } from 'src/entity/user.entity';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { Repository } from 'typeorm';

@Injectable()
export class CityService {
  constructor(@InjectRepository(City) private repo: Repository<City>) {}

  async findAll(
    @Query() options: PaginationDto,
  ): Promise<PaginatedResponse<City>> {
    const { page, limit, search, sortBy, sortOrder } = options;
    const skip = (page! - 1) * limit!;

    const queryBuilder = this.repo.createQueryBuilder('cities');

    if (search) {
      queryBuilder.where(
        'cities.name ILIKE :search OR cities.cityName ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    const [data, totalItems] = await queryBuilder
      .orderBy(`cities.${sortBy}`, sortOrder)
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

  async create(userId: string, data: CreateCityDTO) {
  try {
    const city = new City();

    city.region = data.region;
    city.cityName = data.cityName;
    city.createdByUser = { id: userId } as User;
    city.createdAt = new Date(); 
    
    city.updatedByUser = { id: userId } as User;
    city.updatedAt = new Date();

    const savedCity = await this.repo.save(city);
    
    return await this.repo.findOne({
      where: { id: savedCity.id },
      relations: ['createdByUser', 'updatedByUser']
    });
  } catch (error) {
    console.error('Error creating city:', error);
    
    // Handle duplicate key error (unique constraint)
    if ((error as Error).message.includes('23505')) { // PostgreSQL duplicate key error code
      throw new ConflictException('City with this region and name already exists');
    }
    
    throw new InternalServerErrorException('Failed to create city');
  }
}
}
