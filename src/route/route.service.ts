import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRouteDto } from 'src/dto/create-route.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { City } from 'src/entity/cities.entity';
import { Route } from 'src/entity/route.entity';
import { User } from 'src/entity/user.entity';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { In, Repository } from 'typeorm';

export class RouteResponseDTO {
  id: string;
  originCity: {
    id: string;
    region: string;
    cityName: string;
  };
  originTerminal: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  destinationTerminal: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  destinationCity: {
    id: string;
    region: string;
    cityName: string;
  };
  description: string;
  distance: number;
  price: number;
  stops: {
    cityId: string;
    distanceFromOrigin: number;
    cityName: string;
  }[];
  isActive: boolean;
  estimatedDurationMinutes: number;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePictureUrl: string;
  };
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePictureUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route) private repo: Repository<Route>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(City) private cityRepo: Repository<City>,
  ) {}

  async getRoutes(
    options: PaginationDto,
  ): Promise<PaginatedResponse<RouteResponseDTO>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('routes')
      .leftJoinAndSelect('routes.originCity', 'originCity')
      .leftJoinAndSelect('routes.destinationCity', 'destinationCity')
      .leftJoinAndSelect('routes.originTerminal', 'originTerminal')
      .leftJoinAndSelect('routes.destinationTerminal', 'destinationTerminal')
      .leftJoinAndSelect('routes.createdBy', 'createdBy')
      .leftJoinAndSelect('routes.updatedBy', 'updatedBy')
      .addSelect([
        'createdBy.id',
        'createdBy.firstName',
        'createdBy.lastName',
        'createdBy.email',
        'createdBy.phone',

        'updatedBy.id',
        'updatedBy.firstName',
        'updatedBy.lastName',
        'updatedBy.email',
        'updatedBy.phone',
      ]);

    if (search) {
      queryBuilder.where(
        `originCity.name ILIKE :search OR destinationCity.name ILIKE :search`,
        { search: `%${search}%` },
      );
    }

    const [data, totalItems] = await queryBuilder
      .orderBy(`routes.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    const cityIds = [
      ...new Set(
        data.flatMap(
          (route) =>
            route.stops?.map((stop) => {
              return stop.cityName;
            }) ?? [],
        ),
      ),
    ];

    // const cities = await this.cityRepo.find({
    //   where: {
    //     id: In(cityIds),
    //   },
    // });

    // const cityMap = new Map(cities.map((city) => [city.id, city]));
    
    // for (const route of data) {
    //   route.stops =
    //     route.stops?.map((stop) => ({
    //       ...stop,
    //       cityName: cityMap.get(stop.cityId)?.cityName ?? '',
    //     })) ?? [];
    // }

    const totalPages = Math.ceil(totalItems / limit!);
    const hasNextPage = page! < totalPages;
    const hasPreviousPage = page! > 1;

    let _data: RouteResponseDTO[] = [];

    data.forEach((d) => {
      _data.push({
        id: d.id,
        originCity: {
          id: d.originCityId,
          region: d.originCity.region,
          cityName: d.originCity.cityName,
        },
        originTerminal: {
          id: d.originTerminal.id,
          name: d.originTerminal.name,
          latitude: d.originTerminal.coordinates.lat,
          longitude: d.originTerminal.coordinates.lng,
        },
        destinationTerminal: {
          id: d.destinationTerminal.id,
          name: d.destinationTerminal.name,
          latitude: d.destinationTerminal.coordinates.lat,
          longitude: d.destinationTerminal.coordinates.lng,
        },
        destinationCity: {
          id: d.destinationCityId,
          region: d.destinationCity.region,
          cityName: d.destinationCity.cityName,
        },
        description: d.description,
        distance: d.distance,
        price: d.price,
        stops: d.stops.map((stop) => {
          return {
            cityId: stop.cityId,
            cityName: stop.cityName,
            distanceFromOrigin: stop.distanceFromOrigin!,
          };
        }),
        isActive: d.isActive,
        estimatedDurationMinutes: d.estimatedDurationMinutes,
        createdBy: {
          id: 'd.createdBy.id',
          firstName: d.createdBy.firstName,
          lastName: d.createdBy.lastName,
          email: d.createdBy.email,
          phone: d.createdBy.phone,
          profilePictureUrl: d.createdBy.profilePictureUrl,
        },
        updatedBy: {
          id: d.updatedBy?.id,
          firstName: d.updatedBy?.firstName,
          lastName: d.updatedBy?.lastName,
          email: d.updatedBy?.email,
          phone: d.updatedBy?.phone,
          profilePictureUrl: d.updatedBy?.profilePictureUrl,
        },
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      });
    });

    return {
      data: _data,
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

  async countRoutes(): Promise<number> {
    const totalRoutes = await this.repo.count({
      where: {
        isActive: true,
      },
    });

    return totalRoutes;
  }

  async getRouteDetail(id: string): Promise<RouteResponseDTO> {
    const route = await this.repo
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.createdBy', 'createdBy')
      .leftJoinAndSelect('route.updatedBy', 'updatedBy')
      .leftJoinAndSelect('route.originCity', 'originCity')
      .leftJoinAndSelect('route.originTerminal', 'originTerminal')
      .leftJoinAndSelect('route.destinationCity', 'destinationCity')
      .leftJoinAndSelect('route.destinationTerminal', 'destinationTerminal')
      .where('route.id = :id', { id })
      .getOne();

    if (!route) {
      throw new NotFoundException(`Route with id = ${id} not found.`);
    }

    const _route: any = {
      id: route.id,
      originCity: {
        id: route.originCityId,
        region: route.originCity.region,
        cityName: route.originCity.cityName,
      },
      originTerminal: {
        id: route.originTerminal.id,
        name: route.originTerminal.name,
        latitude: route.originTerminal.coordinates.lat,
        longitude: route.originTerminal.coordinates.lng,
      },
      destinationTerminal: {
        id: route.destinationTerminal.id,
        name: route.destinationTerminal.name,
        latitude: route.destinationTerminal.coordinates.lat,
        longitude: route.destinationTerminal.coordinates.lng,
      },
      destinationCity: {
        id: route.destinationCityId,
        region: route.destinationCity.region,
        cityName: route.destinationCity.cityName,
      },
      description: route.description,
      duration: route.estimatedDurationMinutes,
      distance: route.distance,
      price: route.price,
      isActive: route.isActive,
      estimatedDurationMinutes: route.estimatedDurationMinutes,
      createdBy: {
        id: route.createdBy.id,
        firstName: route.createdBy.firstName,
        lastName: route.createdBy.lastName,
        email: route.createdBy.email,
        phone: route.createdBy.phone,
        profilePictureUrl: route.createdBy.profilePictureUrl,
      },
      updatedBy: {
        id: route.updatedBy?.id,
        firstName: route.updatedBy?.firstName,
        lastName: route.updatedBy?.lastName,
        email: route.updatedBy?.email,
        phone: route.updatedBy?.phone,
        profilePictureUrl: route.updatedBy?.profilePictureUrl,
      },
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
    };

    const cityIds = [...new Set(route.stops.map((item) => item.cityId))];

    const cities = await this.cityRepo.find({
      where: {
        id: In(cityIds),
      },
    });

    const cityMap = new Map(cities.map((city) => [city.id, city]));

    const stops = route.stops.map((r) => {
      const city = cities.find((s) => s.id === r.cityId);

      return {
        // ...r,
        distanceFromOrigin: r.distanceFromOrigin,
        cityName: city?.cityName,
        cityId: city?.id,
      };
    });
    _route.stops = stops;

    return _route;
  }

  async create(data: {
    userId: string;
    companyId: string;
    route: CreateRouteDto;
  }) {
    try {
      const { userId, companyId, route } = data;

      let user: User | null = null;
      if (userId) {
        user = await this.userRepo.findOne({
          where: { id: userId },
        });

        if (!user) {
          return new ForbiddenException(`Forbbiden or session timeout`);
        }

        const existingRoute = await this.repo.findOne({
          where: {
            originCityId: route.origin,
            destinationCityId: route.destination,
          },
        });

        if (existingRoute) {
          return new BadRequestException(`Route already exists`);
        }

        const newRoute = this.repo.create({
          originCityId: route.origin,
          originTerminalId: route.originTerminalId,
          destinationCityId: route.destination,
          destinationTerminalId: route.destinationTerminalId,
          price: route.fare,
          stops: route.stops,
          estimatedDurationMinutes: route.duration,
          distance: route.distance,
          description: route.description,
          isActive: true,
          companyId,
          createdById: userId!,
        });

        const savedRoute = await this.repo.save(newRoute);
        return await this.repo.findOne({
          where: { id: savedRoute.id },
        });
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async update(data: { userId: string; id: string; route: CreateRouteDto }) {
    try {
      const { userId, id, route } = data;

      let user: User | null = null;
      if (userId) {
        user = await this.userRepo.findOne({
          where: { id: userId },
        });

        if (!user) {
          return new ForbiddenException(`Forbbiden or session timeout`);
        }

        const existingRoute = await this.repo.findOne({
          where: {
            id,
          },
        });

        if (!existingRoute) {
          return new BadRequestException(`Route not found`);
        }

        await this.repo.update(
          {
            id,
          },
          {
            originCityId: route.origin,
            destinationCityId: route.destination,
            price: route.fare,
            stops: route.stops,
            estimatedDurationMinutes: route.duration,
            distance: route.distance,
            description: route.description,
            updatedById: userId!,
          },
        );

        return await this.repo.findOne({
          where: { id },
        });
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async toggleRouteStatus(id: string, userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Invalid user`);
    }

    const route = await this.repo.findOne({
      where: { id },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    const result = await this.repo.update(id, {
      isActive: !route.isActive,
      updatedById: userId,
      updatedBy: user,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return await this.repo.findOne({ where: { id } });
  }
}
