import { BaseRepository } from '../repositories/BaseRepository';

import { Repository } from 'typeorm';
import { LeaseTracking } from '../entities/lease-tracking.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LeaseTrackingRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LLease_LTracking_LRepository extends _LBases');
  }

  constructor(
    @InjectRepository(LeaseTracking)
    private leaseTrackingRepository: Repository<LeaseTracking>,
  ) {}

  async create(leaseTracking: LeaseTracking): Promise<LeaseTracking> {
    return this.leaseTrackingRepository.save(leaseTracking);
  }

  async readAll(tenant_id: string): Promise<LeaseTracking[]> {
    return this.leaseTrackingRepository.find({ where: { tenant_id } });
  }

  async readById(id: string, tenant_id: string): Promise<LeaseTracking | null> {
    return this.leaseTrackingRepository.findOne({ where: { id, tenant_id } });
  }

  async update(id: string, leaseTracking: Partial<LeaseTracking>, tenant_id: string): Promise<LeaseTracking | null> {
    await this.leaseTrackingRepository.update({ id, tenant_id }, leaseTracking);
    return this.leaseTrackingRepository.findOne({ where: { id, tenant_id } });
  }

  async delete(id: string, tenant_id: string): Promise<boolean> {
    const result = await this.leaseTrackingRepository.delete({ id, tenant_id });
    return result.affected > 0;
  }

  async query1(param1: string, tenant_id: string): Promise<LeaseTracking[]> {
    return this.leaseTrackingRepository
      .createQueryBuilder('lease_tracking')
      .where('lease_tracking.tenant_id = :tenant_id', { tenant_id })
      .andWhere('lease_tracking.column1 = :param1', { param1 })
      .getMany();
  }

  async query2(param1: string, param2: string, tenant_id: string): Promise<LeaseTracking[]> {
    return this.leaseTrackingRepository
      .createQueryBuilder('lease_tracking')
      .where('lease_tracking.tenant_id = :tenant_id', { tenant_id })
      .andWhere('lease_tracking.column1 = :param1', { param1 })
      .andWhere('lease_tracking.column2 = :param2', { param2 })
      .getMany();
  }

  async query3(param1: string, param2: string, param3: string, tenant_id: string): Promise<LeaseTracking[]> {
    return this.leaseTrackingRepository
      .createQueryBuilder('lease_tracking')
      .where('lease_tracking.tenant_id = :tenant_id', { tenant_id })
      .andWhere('lease_tracking.column1 = :param1', { param1 })
      .andWhere('lease_tracking.column2 = :param2', { param2 })
      .andWhere('lease_tracking.column3 = :param3', { param3 })
      .getMany();
  }
}
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM leasetracking t
    WHERE t.id = \api/src/repositories/leasetracking.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM leasetracking t
    WHERE t.tenant_id = \api/src/repositories/leasetracking.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
