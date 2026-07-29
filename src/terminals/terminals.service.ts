import { BadRequestException, Body, Injectable, NotFoundException, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequireAccess } from 'src/decorators/access.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { CreateTerminalDTO } from 'src/dto/create-terminal.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { UpdateTerminalDTO } from 'src/dto/update-terminal.dto';
import { Terminal } from 'src/entity/terminal.entity';
import { User } from 'src/entity/user.entity';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { ILike, Not, Repository } from 'typeorm';

@Injectable()
export class TerminalsService {
  constructor(
    @InjectRepository(Terminal) private repo: Repository<Terminal>,
    // @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findAllTerminals(
    options: PaginationDto,
  ): Promise<PaginatedResponse<Terminal>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('terminals')
      .leftJoinAndSelect('terminals.city', 'city');

    if (search) {
      queryBuilder.where(
        `terminals.name ILIKE :search OR terminals.name ILIKE :search`,
        { search: `%${search}%` },
      );
    }

    const [data, totalItems] = await queryBuilder
      .orderBy(`terminals.${sortBy}`, sortOrder)
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

  async getTerminalsByCityId(cityId: string): Promise<Terminal[]> {
    return await this.repo.find({
      where: {
        city: { id: cityId },
        isActive: true, 
      },
      relations: ['city'], 
    });
  }

  async getTerminalById(id: string): Promise<Terminal | null> {
    return await this.repo.findOne({
      where: { id },
      relations: ['city'],
    });
  }

  async create(terminal: CreateTerminalDTO) {
    // const _user = user as unknown as any;
    // const companyId = user.companyId ? user.companyId : terminal.companyId;

    const existingTerminal = this.repo.findOne({
      where: {
        name: ILike(terminal.name),
        city: { id: terminal.cityId },
      },
    });

    if (!existingTerminal) {
      throw new BadRequestException(`Terminal name already exists`);
    }

    const newTerminal = this.repo.create({
      name: terminal.name,
      city: { id: terminal.cityId },
      address: {
        subCity: terminal.subCity,
        woreda: terminal.woreda,
      },
      coordinates: {
        lat: terminal.latitude,
        lng: terminal.longitude,
      },
      description: terminal.description,
      phone: terminal.phone,
      email: terminal.email,
      isActive: true,
    } as unknown as Terminal);

    return await this.repo.save(newTerminal);
  }

  async update(id: string, terminal: UpdateTerminalDTO) {
    const existingTerminal = this.repo.findOne({
      where: {
        id,
      },
    });

    if (!existingTerminal) {
      throw new BadRequestException(`Terminal not found.`);
    }

    const _terminal = await this.repo.findOne({
      where: {
        name: ILike(terminal.name),
        id: Not(id),
        city: { id: Not(terminal.cityId)}
      },
    });

    if (_terminal !== null) {
      throw new BadRequestException(`Terminal name "${terminal.name}" in the city already exists`);
    }

    await this.repo.update(
      { id },
      {
        name: terminal.name,
        city: {id: terminal.cityId},
        phone: terminal.phone,
        email: terminal.email,
        description: terminal.description,
        address: {
            subCity: terminal.subCity,
            woreda: terminal.woreda
        },
        coordinates: {
            lat: terminal.latitude ? Number(terminal.latitude) : undefined,
            lng: terminal.longitude ? Number(terminal.longitude) : undefined
        }
    },
    );

    return await this.repo.findBy({ id });
  }

  async toggleTerminalStatus(id: string) {
      const terminal = await this.repo.findOne({
        where: { id },
      });
  
      if (!terminal) {
        throw new NotFoundException(`Terminal with ID ${id} not found`);
      }
  
      const result = await this.repo.update(id, {
        isActive: !terminal.isActive,
      });
  
      if (result.affected === 0) {
        throw new NotFoundException(`Update failed. Please try again.`);
      }
  
      return await this.repo.findOne({ where: { id } });
    }
}
