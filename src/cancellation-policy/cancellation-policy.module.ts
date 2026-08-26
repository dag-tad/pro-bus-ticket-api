import { Module } from '@nestjs/common';
import { CancellationPolicyService } from './cancellation-policy.service';
import { CancellationPolicyController } from './cancellation-policy.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CancellationPolicy } from 'src/entity/cancellation-policy.entity';
import { CancellationPolicyTier } from 'src/entity/cancellation-policy-tiers.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CancellationPolicy, CancellationPolicyTier])],
  providers: [CancellationPolicyService],
  controllers: [CancellationPolicyController]
})
export class CancellationPolicyModule {}
