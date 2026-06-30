import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDTO } from '../dto/create-user.dto';
import { User } from '../entity/user.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async findOneByPhone(phone: string): Promise<User> {
    const user = await this.repo.findOneBy({
      phone,
    });

    if (!user) {
      throw new NotFoundException('Could not find user');
    }

    return user;
  }

  async findAll(_data: {
    options?: PaginationDto;
    companyId?: string;
  }): Promise<PaginatedResponse<User>> {
    const { options, companyId } = _data;
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const search = options?.search;
    const sortBy = options?.sortBy;
    const sortOrder = options?.sortOrder;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo.createQueryBuilder('users');

    if (search) {
      queryBuilder.where(
        `users.firstName ILIKE :search OR users.lastName ILIKE :search`,
        { search: `%${search}%` },
      );
    }

    if (companyId) {
      queryBuilder.andWhere('users.companyId = :companyId', {
        companyId,
      });
    }

    queryBuilder.leftJoinAndSelect('users.createdBy', 'createdBy');

    const [data, totalItems] = await queryBuilder
      .orderBy(`users.${sortBy}`, sortOrder)
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

  async countUsers(companyId?: string): Promise<number> {
    const totalUsers = await this.repo.count({
      where: {
        companyId,
      },
    });

    return totalUsers;
  }

  async getUserDetail(
    id: string,
  ): Promise<
    Partial<User> & {
      companyId?: string;
      companyName?: string;
      companyPhone?: string;
      companyRegion?: string;
      companyCity?: string;
    }
  > {
    const user = await this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with id = ${id} not found.`);
    }
    
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      realm: user.realm,
      role: user.role,
      email: user.email,
      phone: user.phone,
      enable2FA: user.enable2FA,
      createdAt: user.createdAt,
      enabled: user.enabled,
      companyId: user.companyId,
      companyName: user.company?.name,
      companyPhone: user.company?.phoneNumber,
      companyCity: user.company?.city,
      companyRegion: user.company?.region,
    };
  }
}
