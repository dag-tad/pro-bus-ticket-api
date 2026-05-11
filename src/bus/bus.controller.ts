import { Body, Controller, Post } from '@nestjs/common';
import { BusDTO } from 'src/dto/bus.dto';
import { Bus } from 'src/entity/bus.entity';
import { BusService } from './bus.service';

@Controller('bus')
export class BusController {
    constructor(
        private busService: BusService,
      ) {}
    @Post('create')
      createBus(
        @Body() busDto: BusDTO,
      ): Promise<Bus> {
        return this.busService.create(busDto);
      }
}
