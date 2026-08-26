import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CancellationPolicyTierDTO, CreateCancellationPolicyDTO } from 'src/dto/cancellation-policy-tier.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { UpdateCancellationPolicyDTO } from 'src/dto/update-cancellation-policy.dto';
import { CancellationPolicyTier } from 'src/entity/cancellation-policy-tiers.entity';
import { CancellationPolicy } from 'src/entity/cancellation-policy.entity';
import { PaginatedResponse } from 'src/interfaces/paginatedResponse.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CancellationPolicyService {
  constructor(
    @InjectRepository(CancellationPolicy)
    private repo: Repository<CancellationPolicy>,
    @InjectRepository(CancellationPolicyTier)
    private tierRepo: Repository<CancellationPolicyTier>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllCancellationPolicies(
    options: PaginationDto,
    companyId?: string,
  ): Promise<PaginatedResponse<CancellationPolicy>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo.createQueryBuilder('cancellation_policies');

    if (companyId) {
      queryBuilder.where('cancellation_policies.companyId = :companyId', {
        companyId,
      });
    }

    queryBuilder.leftJoinAndSelect('cancellation_policies.company', 'company');
    queryBuilder.leftJoinAndSelect('cancellation_policies.tiers', 'tiers');

    const [data, totalItems] = await queryBuilder
      .orderBy(`cancellation_policies.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit!);
    const hasNextPage = page! < totalPages;
    const hasPreviousPage = page! > 1;

    return {
      data,
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

  async getCancellationPolicyById(id: string, companyId?: string): Promise<CancellationPolicy | null> {
    const filter = {
        id,
        companyId
    }

    return await this.repo.findOne({
      where: filter,
      relations: ['company', 'tiers'],
    });
  }

  async createCancellationPolicy(
    data: CreateCancellationPolicyDTO & { companyId: string },
  ) {
    try {
      const { companyId, description, tiers } = data;

      const policy = await this.dataSource.transaction(async (manager) => {
        await manager.update(
          CancellationPolicy,
          { companyId },
          { enabled: false },
        );
        const _policy = await manager.save(CancellationPolicy, {
          companyId,
          description,
          enabled: true,
        });

        const savedTiers: CancellationPolicyTier[] = [];

        for (let i = 0; i < tiers.length; i++) {
          const tierData = {
            ...tiers[i],
            policy_tier_id: _policy.id,
          };

          const savedTier = await manager.save(
            CancellationPolicyTier,
            tierData,
          );
          savedTiers.push(savedTier);
        }

        const allTiers = await manager.find(CancellationPolicyTier, {
          where: {
            policy_tier_id: _policy.id,
          },
        });

        return {
          ..._policy,
          tiers: allTiers,
        };
      });

      return policy;
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
      throw new BadGatewayException('Internal server error. Please try again.');
    }
  }

  async updateCancellationPolicy(
    data: {tiers: CancellationPolicyTierDTO[], companyId: string, id: string },
  ) {
    try {
      const { companyId, tiers, id } = data;

      const policy = await this.dataSource.transaction(async (manager) => {
        await manager.update(
          CancellationPolicy,
          { companyId },
          { enabled: false },
        );

        const _policy = await manager.save(CancellationPolicy, {
          companyId,
          enabled: true,
        });

        const savedTiers: CancellationPolicyTier[] = [];

        for (let i = 0; i < tiers.length; i++) {
          const tierData = {
            ...tiers[i],
            policy_tier_id: _policy.id,
          };

          const savedTier = await manager.save(
            CancellationPolicyTier,
            tierData,
          );

          savedTiers.push(savedTier);
        }

        const allTiers = await manager.find(CancellationPolicyTier, {
          where: {
            policy_tier_id: _policy.id,
          },
        });

        return {
          ..._policy,
          tiers: allTiers,
        };
      });

      return policy;
    } catch (error) {
      throw new BadGatewayException('Internal server error. Please try again.');
    }
  }
}
