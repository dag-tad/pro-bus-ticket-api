import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { BusDTO } from '../dto/bus.dto';
import { BusService } from './bus.service';
import { AccessGuard } from '../auth/guard/access.guard';
import { AccessTokenJWTGuard } from '../auth/guard/access-token-jwt.guard';
import { RequireAccess } from '../decorators/access.decorator';
import { REALM } from '../enums/realm.enum';
import { ROLE } from '../enums/role.enum';

@Controller('bus')
@UseGuards(AccessTokenJWTGuard, AccessGuard)
export class BusController {
    constructor(
        private busService: BusService,
    ) { }

    @RequireAccess([REALM.SUPER_ADMIN, REALM.TRANSPORT_COMPANY], [ROLE.ADMIN])
    @Post('create')
    async createBus(
        @Body() busDto: BusDTO,
    ): Promise<any> {
        try {
            return new Promise((resolve, _) => {
                return resolve(busDto)
            })
        } catch (error) {
            return { message: (error as Error).message }
        }
        // return this.busService.create(busDto);
    }
}
