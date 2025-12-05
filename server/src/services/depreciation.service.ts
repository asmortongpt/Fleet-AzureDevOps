import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { validateAssetId, validateTenantId, validateMonthISO } from '../utils/validators';
import { DepreciationMethod, calculateDepreciation } from '../utils/depreciationCalculator';
import { AuditLog } from '../utils/auditLog';

class DepreciationService {
  private db: Pool;
  private logger: Logger;

  constructor(db: Pool, logger: Logger) {
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
      AuditLog.log('Depreciation schedule generated', { assetId, tenantId });

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
      AuditLog.log('ERP export generated', { tenantId, monthISO });

      return result.rows;
    } catch (error) {
      this.logger.error('Error exporting for ERP', { tenantId, monthISO, error });
      throw error;
    }
  }
}

export default DepreciationService;
```

```typescript
// utils/validators.ts
export function validateAssetId(assetId: string): void {
  if (!/^[a-zA-Z0-9-]+$/.test(assetId)) {
    throw new Error('Invalid asset ID');
  }
}

export function validateTenantId(tenantId: string): void {
  if (!/^[a-zA-Z0-9-]+$/.test(tenantId)) {
    throw new Error('Invalid tenant ID');
  }
}

export function validateMonthISO(monthISO: string): void {
  if (!/^\d{4}-\d{2}$/.test(monthISO)) {
    throw new Error('Invalid month format');
  }
}
```

```typescript
// utils/depreciationCalculator.ts
export enum DepreciationMethod {
  STRAIGHT_LINE,
  DOUBLE_DECLINING,
  MACRS
}

export function calculateDepreciation(asset: any, method: DepreciationMethod): any {
  // Implement depreciation calculation logic based on the method
  // This is a placeholder for actual calculation logic
  return {};
}
```

```typescript
// utils/auditLog.ts
export class AuditLog {
  public static log(action: string, details: any): void {
    // Implement audit logging logic
    // This could be writing to a database, a file, or an external logging service
  }
}
```

```typescript
// utils/logger.ts
export class Logger {
  public error(message: string, details: any): void {
    // Implement error logging logic
    // This could be writing to a console, a file, or an external logging service
  }
}