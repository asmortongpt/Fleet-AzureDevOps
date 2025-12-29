import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { validateAssetId, validateTenantId, validateMonthISO } from '../utils/validators';
import { DepreciationMethod, calculateDepreciation } from '../utils/depreciationCalculator';
import { auditLog } from '../utils/auditLog';

class DepreciationService {
  private db: Pool;
  private logger: typeof logger;

  constructor(db: Pool, logger: typeof logger) {
    this.db = db;
    this.logger = logger;
  }

  public async schedule(assetId: string, tenantId: string): Promise<any> {
    try {
      validateAssetId(assetId);
      validateTenantId(tenantId);

      const query = 'SELECT * FROM assets WHERE id = $1 AND tenant_id = $2';
      const result = await this.db.query(query, [assetId, tenantId]);

      if (result.rows.length === 0) {
        throw new Error('Asset not found');
      }

      const asset = result.rows[0];
      const depreciationSchedule = calculateDepreciation(asset, DepreciationMethod.STRAIGHT_LINE);

      // Audit logging for schedule generation
      auditLog.log('Depreciation schedule generated', { assetId, tenantId });

      return depreciationSchedule;
    } catch (error) {
      this.logger.error('Error generating depreciation schedule', { assetId, tenantId, error });
      throw error;
    }
  }

  public async exportForERP(tenantId: string, monthISO: string): Promise<any> {
    try {
      validateTenantId(tenantId);
      validateMonthISO(monthISO);

      const query = `
        SELECT * FROM depreciation_entries
        WHERE tenant_id = $1 AND month = $2
      `;
      const result = await this.db.query(query, [tenantId, monthISO]);

      if (result.rows.length === 0) {
        throw new Error('No depreciation entries found for the specified month');
      }

      // Audit logging for ERP export
      auditLog.log('ERP export generated', { tenantId, monthISO });

      return result.rows;
    } catch (error) {
      this.logger.error('Error exporting for ERP', { tenantId, monthISO, error });
      throw error;
    }
  }
}

export default DepreciationService;
