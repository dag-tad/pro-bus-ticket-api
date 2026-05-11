import { Module } from '@nestjs/common';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from 'src/entity/bus.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Bus])],
    providers: [BusService],
    controllers: [BusController],
    exports: [BusService]
})
export class BusModule {

}
