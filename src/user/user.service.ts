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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
  ) {}

  async findOneByPhone(phone: string): Promise<User> {
    const user = await this.repo.findOneBy({
      phone,
    });

    if (!user) {
      throw new NotFoundException('Could not find user');
    }

    return user;
  }
}
