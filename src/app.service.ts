import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck(): { message: string } {
    return {
      message: "Pro-Bus-Ticket is running..."
    };
  }
}
