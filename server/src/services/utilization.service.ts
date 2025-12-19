import { Pool } from 'pg';

import { AuditLog } from '../utils/auditLog';
import { Logger } from '../utils/logger';
import { validateDate, validateUUID, validateEventType } from '../utils/validators';

const pool = new Pool();
const logger = new Logger();
const auditLog = new AuditLog();

export class UtilizationService {
  private static readonly BCRYPT_COST = 12;

  public async report(
    tenantId: string,
    start: string,
    end: string,
    categoryId: string
  ): Promise<any> {
    try {
      // Input validation
      if (!validateUUID(tenantId) || !validateUUID(categoryId) || !validateDate(start) || !validateDate(end)) {
        throw new Error('Invalid input parameters');
      }

      const query = `
        SELECT 
          SUM(CASE WHEN event_type = 'CHECKOUT' THEN 1 ELSE 0 END) AS usage_count,
          SUM(CASE WHEN event_type = 'CHECKIN' THEN 1 ELSE 0 END) AS idle_count,
          SUM(revenue) AS total_revenue,
          SUM(cost) AS total_cost
        FROM asset_events
        WHERE tenant_id = $1 AND category_id = $2 AND started_at >= $3 AND ended_at <= $4
        GROUP BY tenant_id, category_id;
      `;

      const result = await pool.query(query, [tenantId, categoryId, start, end]);
      return result.rows;
    } catch (error) {
      logger.error('Error generating report', error);
      throw error;
    }
  }

  public async recordUsageEvent(event: {
    tenantId: string;
    assetId: string;
    eventType: 'CHECKOUT' | 'CHECKIN' | 'TELEMETRY_ON' | 'TELEMETRY_OFF';
    startedAt: string;
    endedAt: string;
  }): Promise<void> {
    try {
      // Input validation
      if (
        !validateUUID(event.tenantId) ||
        !validateUUID(event.assetId) ||
        !validateEventType(event.eventType) ||
        !validateDate(event.startedAt) ||
        !validateDate(event.endedAt)
      ) {
        throw new Error('Invalid input parameters');
      }

      const query = `
        INSERT INTO asset_events (tenant_id, asset_id, event_type, started_at, ended_at)
        VALUES ($1, $2, $3, $4, $5);
      `;

      await pool.query(query, [
        event.tenantId,
        event.assetId,
        event.eventType,
        event.startedAt,
        event.endedAt,
      ]);

      // Audit logging
      auditLog.log('recordUsageEvent', event.tenantId, event.assetId, event.eventType);
    } catch (error) {
      logger.error('Error recording usage event', error);
      throw error;
    }
  }
}