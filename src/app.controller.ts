import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Check if B-Ticket is running', description: 'Returns \"B-Ticket is running...\" string' })
  @ApiResponse({ status: 200, description: 'Success', })
  @Get()
  health(): { message: string } {
    return this.appService.getHello();
  }
}
