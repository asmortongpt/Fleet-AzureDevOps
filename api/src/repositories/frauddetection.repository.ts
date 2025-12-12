import { BaseRepository } from '../repositories/BaseRepository';

Here is a basic example of a TypeScript repository for fraud detection. This repository includes methods for creating, reading, updating, and deleting (CRUD) fraud detection records. It also includes support for parameterized queries and tenant_id.


import { getRepository, Repository } from 'typeorm';
import { FraudDetection } from '../entities/FraudDetection';

export class FraudDetectionRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LFraud_LDetection_LRepository extends _LBases');
  }

  private dao: Repository<FraudDetection>;

  constructor() {
    this.dao = getRepository(FraudDetection);
  }

  async create(data: FraudDetection) {
    return await this.dao.save(data);
  }

  async detail(id: string) {
    return await this.dao.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<FraudDetection>) {
    return await this.dao.update(id, data);
  }

  async delete(id: string) {
    return await this.dao.delete(id);
  }

  async findByTenantId(tenant_id: string) {
    return await this.dao.find({ where: { tenant_id } });
  }

  async query(query: string, parameters?: any[]) {
    return await this.dao.query(query, parameters);
  }
}


This repository uses the TypeORM library to interact with the database. The `FraudDetection` entity would represent a table in your database that contains fraud detection records.

Please note that you need to replace `FraudDetection` with your actual entity class and you might need to adjust the code according to your database design and business logic.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM frauddetection t
    WHERE t.id = \api/src/repositories/frauddetection.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM frauddetection t
    WHERE t.tenant_id = \api/src/repositories/frauddetection.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
