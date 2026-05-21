import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransportCompanyDTO } from 'src/dto/create-transport-company.dto';
import { TransportCompany } from '../entity/transport-company.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { ImageUploader } from './cloudinary.config';

@Injectable()
export class TransportCompanyService {
  constructor(
    private readonly imageUploader: ImageUploader,
    @InjectRepository(TransportCompany)
    private repo: Repository<TransportCompany>,
  ) {}

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
}
