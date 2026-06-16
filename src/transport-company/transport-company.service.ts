import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransportCompanyDTO } from 'src/dto/create-transport-company.dto';
import { TransportCompany } from '../entity/transport-company.entity';
import { DataSource, Repository } from 'typeorm';
import * as fs from 'fs';
import { ImageUploader } from './cloudinary.config';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { CompanyStatus } from 'src/enums/transport-company.enum';
import { User } from 'src/entity/user.entity';
import { ROLE } from 'src/enums/role.enum';
import { REALM } from 'src/enums/realm.enum';
import { generateOtp } from 'src/auth/auth.service';
import * as bcrypt from 'bcrypt';
import { sendSMS } from 'src/util/send-message';

@Injectable()
export class TransportCompanyService {
  constructor(
    private readonly imageUploader: ImageUploader,
    @InjectRepository(TransportCompany)
    private repo: Repository<TransportCompany>,
    private dataSource: DataSource,
  ) {}

  async findAll(
    @Query() options: PaginationDto,
  ): Promise<PaginatedResponse<TransportCompany>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo.createQueryBuilder('transport_companies');

    if (search) {
      queryBuilder.where(
        `transport_companies.name ILIKE :search OR transport_companies.tradeName ILIKE :search`,
        { search: `%${search}%` },
      );
    }

    queryBuilder.leftJoinAndSelect('transport_companies.users', 'users');

    const [data, totalItems] = await queryBuilder
      .orderBy(`transport_companies.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    console.log(search);

    const totalPages = Math.ceil(totalItems / limit!);
    const hasNextPage = page! < totalPages;
    const hasPreviousPage = page! > 1;
console.log(data)
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

  async create(
    id: string,
    file: Express.Multer.File,
    data: CreateTransportCompanyDTO,
  ) {
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

      const result = await this.dataSource.transaction(async (mgr) => {
        const _company = new TransportCompany();
        const otp = generateOtp();

        _company.licenseNumber = data.licenseNumber;
        _company.name = data.name;
        _company.tradeName = data.tradeName;
        _company.description = data.description;
        _company.logoUrl = uploadedImage.url;
        _company.website = data.website;
        _company.email = data.email;
        _company.phoneNumber = data.phoneNumber;
        _company.alternativePhone = data.alternativePhone;
        _company.region = data.region;
        _company.city = data.city;
        _company.subcity = data.subcity;
        _company.woreda = data.woreda;
        _company.createdAt = new Date();

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(otp.toString(), salt);

        const passwordHistory = [hashedPassword].slice(
          0,
          parseInt(process.env.MAX_PASSWORD_HISTORY || '7'),
        );

        const _user = new User();
        _user.companyId = _company.id;
        _user.firstName = data.firstName;
        _user.lastName = data.lastName;
        _user.phone = data.phone;
        _user.email = data.adminEmail;
        _user.role = ROLE.COMPANY_ADMIN;
        _user.realm = REALM.TRANSPORT_COMPANY;
        _user.createdById = id;
        _user.createdAt = new Date();
        _user.password = hashedPassword;
        _user.passwordHistory = passwordHistory;
        _user.enabled = false

        const savedCompany = await mgr.save(_company);
        const savedUser = await mgr.save(_user);

        sendSMS(
          _user.phone,
          `Dear ${_user.firstName} ${_user.lastName}. Your password is ${otp.toString()}. Please login to our system and change your password before doing anything. `,
        );

        return { company: savedCompany, user: savedUser };
      });

      return result;
    } catch (error) {
      return new InternalServerErrorException(error);
    }
  }

  async getCompanyById(
    id: string,
  ): Promise< TransportCompany | null > {
    return await this.repo.findOneBy({ id });
  }

  async updateStatus(
    id: string,
    status: CompanyStatus,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.repo.update(id, {
      status,
    });

    if (result.affected && result.affected > 0) {
      return { success: true, message: "'Company status updated successfully" };
    }

    return { success: false, message: 'Company status update failed' };
  }
}
