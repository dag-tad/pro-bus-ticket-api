import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Terminal } from 'src/entity/terminal.entity';
import { UserModule } from 'src/user/user.module';
import { TerminalsController } from './terminals.controller';
import { TerminalsService } from './terminals.service';
import { User } from 'src/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Terminal]), ],
  providers: [TerminalsService],
  controllers: [TerminalsController],
  exports: [TerminalsService]
})
export class TerminalsModule {}
