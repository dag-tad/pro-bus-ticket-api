import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateUserDTO } from "src/dto/create-user.dto";
import { User } from "src/entity/user.entity";
import * as bcrypt from 'bcrypt';
import { Repository } from "typeorm";

@Injectable()
export class UserHandler {
  constructor(
      @InjectRepository(User) private repo: Repository<User>,
    ) {}
    
  async create(data: CreateUserDTO) {
    try {
          const existingUser = await this.repo.findOneBy({ phone: data.phone });
          if (existingUser) {
            throw new BadRequestException({ message: '' });
          }
    
          const user = new User();
    
          user.firstName = data.firstName;
          user.lastName = data.lastName;
          user.email = data.email;
          user.phone = data.phone;
          user.fanNumber = data.fanNumber;
          user.passwordHistory = [];
          user.createdAt = new Date();
          user.passwordSet = false
    
          await this.repo.save(user)
        } catch (error) {
          console.log(error)
          throw error;
        }
  }
}