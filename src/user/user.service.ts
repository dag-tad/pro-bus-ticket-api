import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDTO } from 'src/dto/create-user.dto';
import { User } from 'src/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    // private jwtService: JwtService,
  ) {}

  async createUser(data: CreateUserDTO): Promise<CreateUserDTO> {
    try {
      const existingUser = await this.repo.findOneBy({ phone: data.phone });

      if (existingUser) {
        throw new BadRequestException({ message: '' });
      }

      const user = new User();

      user.firstName = data.firstName;
      user.lastName = data.lastName;
      user.gender = data.gender;
      user.email = data.email;
      user.phone = data.phone;
      user.fanNumber = data.fanNumber;
      user.passwordHistor = [];
      user.createdAt = new Date();

      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(data.password, salt);

      const newUser = (await this.repo.save(user)) as unknown as CreateUserDTO;

      return newUser;
    } catch (error) {
      throw error;
    }
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
}
