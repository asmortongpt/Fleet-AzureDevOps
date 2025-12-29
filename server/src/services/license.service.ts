import { Pool } from 'pg';

import { auditLog } from '../utils/auditLog';
import { logger } from '../utils/logger';
import { validateLicenseInput, validateTenantId, validateAllocationInput } from '../utils/validators';

const pool = new Pool();
const appLogger = new Logger();

interface License {
  productName: string;
  vendor: string;
  seatsTotal: number;
  renewalAt: Date;
  costPerPeriod: number;
  contractUrl: string;
}

interface Allocation {
  licenseId: string;
  assetId?: string;
  userId?: string;
  seatsAllocated: number;
}

class LicenseService {
  async create(tenantId: string, license: License): Promise<void> {
    validateTenantId(tenantId);
    validateLicenseInput(license);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const queryText = `
        INSERT INTO licenses (tenant_id, product_name, vendor, seats_total, renewal_at, cost_per_period, contract_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await client.query(queryText, [
        tenantId,
        license.productName,
        license.vendor,
        license.seatsTotal,
        license.renewalAt,
        license.costPerPeriod,
        license.contractUrl,
      ]);
      await client.query('COMMIT');
      auditLog('CREATE_LICENSE', tenantId, license);
    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error('Error creating license', error);
      throw new Error('Error creating license');
    } finally {
      client.release();
    }
  }

  async list(tenantId: string): Promise<any> {
    validateTenantId(tenantId);

    try {
      const queryText = `
        SELECT product_name, vendor, seats_total, 
          (SELECT COUNT(*) FROM allocations WHERE license_id = l.id AND tenant_id = $1) AS seats_used
        FROM licenses l
        WHERE tenant_id = $1
      `;
      const result = await pool.query(queryText, [tenantId]);
      return result.rows;
    } catch (error) {
      appLogger.error('Error listing licenses', error);
      throw new Error('Error listing licenses');
    }
  }

  async allocate(tenantId: string, allocation: Allocation): Promise<void> {
    validateTenantId(tenantId);
    validateAllocationInput(allocation);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const queryText = `
        INSERT INTO allocations (tenant_id, license_id, asset_id, user_id, seats_allocated)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(queryText, [
        tenantId,
        allocation.licenseId,
        allocation.assetId,
        allocation.userId,
        allocation.seatsAllocated,
      ]);
      await client.query('COMMIT');
      auditLog('ALLOCATE_LICENSE', tenantId, allocation);
    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error('Error allocating license', error);
      throw new Error('Error allocating license');
    } finally {
      client.release();
    }
  }
}

export default new LicenseService();