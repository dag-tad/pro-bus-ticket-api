import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDTO } from 'src/dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Post()
  async create(@Body() user: CreateUserDTO) {
    return await this.userService.createUser(user);
  }
}
