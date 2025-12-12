import { BaseRepository } from '../repositories/BaseRepository';

Here is an example of a TypeScript repository `LicenseRenewalsRepository` for `license-renewals.routes.ts`. This repository includes parameterized queries, tenant_id, and CRUD operations.


import { EntityRepository, Repository } from 'typeorm';
import { LicenseRenewal } from '../entities/license-renewal.entity';

@EntityRepository(LicenseRenewal)
export class LicenseRenewalsRepository extends Repository<LicenseRenewal> {
  constructor(pool: Pool) {
    super(pool, 'LLicense_LRenewals_LRepository extends s');
  }


  async createLicenseRenewal(tenantId: string, licenseRenewalData: any): Promise<LicenseRenewal> {
    const licenseRenewal = this.create({ ...licenseRenewalData, tenantId });
    await this.save(licenseRenewal);
    return licenseRenewal;
  }

  async getLicenseRenewals(tenantId: string): Promise<LicenseRenewal[]> {
    return this.find({ where: { tenantId } });
  }

  async getLicenseRenewalById(tenantId: string, id: string): Promise<LicenseRenewal> {
    return this.findOne({ where: { id, tenantId } });
  }

  async updateLicenseRenewal(tenantId: string, id: string, licenseRenewalData: any): Promise<LicenseRenewal> {
    await this.update({ id, tenantId }, licenseRenewalData);
    return this.getLicenseRenewalById(tenantId, id);
  }

  async deleteLicenseRenewal(tenantId: string, id: string): Promise<void> {
    await this.delete({ id, tenantId });
  }
}


In this repository, we have methods for creating, reading, updating, and deleting license renewals. Each method includes a `tenantId` parameter to ensure that operations are performed within the context of a specific tenant. 

Please note that you need to replace `any` with the actual type of the license renewal data. Also, you need to have a `LicenseRenewal` entity defined in your application, which is used here in the repository.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM licenserenewals t
    WHERE t.id = \api/src/repositories/licenserenewals.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM licenserenewals t
    WHERE t.tenant_id = \api/src/repositories/licenserenewals.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
