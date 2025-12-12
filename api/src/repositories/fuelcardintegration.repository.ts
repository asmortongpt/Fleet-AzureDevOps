import { BaseRepository } from '../repositories/BaseRepository';

import { Repository } from 'typeorm';
import { FuelCardIntegration } from '../entities/fuel-card-integration.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FuelCardIntegrationRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LFuel_LCard_LIntegration_LRepository extends _LBases');
  }

  constructor(
    @InjectRepository(FuelCardIntegration)
    private fuelCardIntegrationRepository: Repository<FuelCardIntegration>,
  ) {}

  async create(data: Partial<FuelCardIntegration>, tenant_id: string): Promise<FuelCardIntegration> {
    const fuelCardIntegration = this.fuelCardIntegrationRepository.create({
      ...data,
      tenant_id,
    });
    return this.fuelCardIntegrationRepository.save(fuelCardIntegration);
  }

  async read(id: string, tenant_id: string): Promise<FuelCardIntegration | null> {
    return this.fuelCardIntegrationRepository.findOne({
      where: { id, tenant_id },
    });
  }

  async update(id: string, data: Partial<FuelCardIntegration>, tenant_id: string): Promise<FuelCardIntegration | null> {
    await this.fuelCardIntegrationRepository.update({ id, tenant_id }, data);
    return this.fuelCardIntegrationRepository.findOne({
      where: { id, tenant_id },
    });
  }

  async delete(id: string, tenant_id: string): Promise<boolean> {
    const result = await this.fuelCardIntegrationRepository.delete({ id, tenant_id });
    return result.affected > 0;
  }

  async list($1: any, $2: any, $3: any, tenant_id: string): Promise<FuelCardIntegration[]> {
    return this.fuelCardIntegrationRepository.find({
      where: { tenant_id, $1, $2, $3 },
    });
  }
}
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM fuelcardintegration t
    WHERE t.id = \api/src/repositories/fuelcardintegration.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM fuelcardintegration t
    WHERE t.tenant_id = \api/src/repositories/fuelcardintegration.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
