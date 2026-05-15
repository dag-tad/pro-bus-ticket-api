import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { BusDTO } from 'src/dto/bus.dto';
import { Bus } from 'src/entity/bus.entity';
import { BusService } from './bus.service';
import { AccessGuard } from 'src/auth/guard/access.guard';
import { AccessTokenJWTGuard } from 'src/auth/guard/access-token-jwt.guard';
import { RequireAccess } from 'src/decorators/access.decorator';
import { REALM } from 'src/enums/realm.enum';
import { ROLE } from 'src/enums/role.enum';

@Controller('bus')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class BusController {
    constructor(
        private busService: BusService,
    ) { }

    @RequireAccess([REALM.PASSANGER, REALM.TRANSPORT_COMPANY], [ROLE.ADMIN])
    @Post('create')
    async createBus(
        @Body() busDto: BusDTO,
    ): Promise<Bus> {
        return new Promise((_, resolve) => {
            resolve(busDto as Bus)
        })
        // return this.busService.create(busDto);
    }
}
