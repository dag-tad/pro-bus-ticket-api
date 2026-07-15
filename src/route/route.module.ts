import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from 'src/entity/route.entity';
import { RouteService } from './route.service';
import { RouteController } from './route.controller';
import { User } from 'src/entity/user.entity';
import { City } from 'src/entity/cities.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Route, User, City]), ],
  providers: [RouteService],
  controllers: [RouteController],
  exports: [RouteService]
})
export class RouteModule {}
