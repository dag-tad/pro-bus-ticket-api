import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDTO } from '../dto/create-user.dto';
import { User } from '../entity/user.entity';
import { Repository, UpdateResult } from 'typeorm';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import * as bcrypt from 'bcrypt';
import { generateOtp } from 'src/auth/auth.service';
import { sendSMS } from 'src/util/send-message';
import { UpdateUserDTO } from 'src/dto/update-user.dto ';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async createUser({
    createdById,
    companyId,
    data,
  }: {
    createdById: string;
    companyId: string;
    data: CreateUserDTO;
  }): Promise<CreateUserDTO> {
    const existingUser = await this.repo.findOne({
      where: { phone: data.phone }
    })

    if (existingUser) {
      throw new BadRequestException(`User with phone number ${data.phone} already exist.`)
    }

    const salt = await bcrypt.genSalt();
    const otp = generateOtp();

    const hashedPassword = await bcrypt.hash(otp.toString(), salt);

    const passwordHistory = [hashedPassword].slice(
      0,
      parseInt(process.env.MAX_PASSWORD_HISTORY || '7'),
    );

    const user = new User();
    user.companyId = companyId;
    user.firstName = data.firstName;
    user.lastName = data.lastName;
    user.phone = data.phone;
    user.email = data.email;
    user.role = data.role;
    user.realm = data.realm;
    user.createdById = createdById;
    user.createdAt = new Date();
    user.password = hashedPassword;
    user.passwordHistory = passwordHistory;
    user.enabled = true;
    user.gender = data.gender;

    const savedUser = await this.repo.save(user);

    const _user = await this.repo.findOne({ where: { id: savedUser.id } });

    if (!_user) {
      throw new InternalServerErrorException(
        'Something went wrong. Please try again or contact the system administrator.',
      );
    }

    sendSMS(
      user.phone,
      `Dear ${user.firstName} ${user.lastName}. Your password is ${otp.toString()}. Please login to our system and change your password before doing anything. `,
    );

    return { ..._user } as unknown as CreateUserDTO;
  }

  async updateateUser({
    id,
    data,
  }: {
    id: string;
    data: UpdateUserDTO;
  }): Promise<UpdateResult> {
    const existingUser = await this.repo.findOne({
      where: { id }
    })

    if (!existingUser) {
      throw new BadRequestException(`User not found.`)
    }

    return await this.repo.update(
      { id: data.id },
      { ...data, updatedAt: new Date() }
    )
  }

  async updateUserStatus(userId: string, updatedById: string): Promise<UpdateResult> {
    const user = await this.repo.findOne({
      where: { id: userId }
    })

    if (!user) {
      throw new BadRequestException(`User not found.`)
    }

    const result = await this.repo.update(
      { id: userId },
      { enabled: !user.enabled,},
    )

    return result
  }

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

  async getUserDetail(id: string): Promise<
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
      gender: user.gender,
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
