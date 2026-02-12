/**
 * Insurance Claims Workflow Service
 * Handles automated claim creation, status tracking, loss ratios, and expiration alerts
 */

import { Pool, PoolClient } from 'pg';

import logger from '../config/logger';
import {
  InsuranceClaim,
  InsurancePolicy,
  ClaimTimelineEvent,
  LossRatio,
  PolicyExpirationAlert,
  ClaimStatus,
} from '../types/insurance';

export class InsuranceClaimsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Auto-create claim from incident
   * Automatically generates a claim when an incident is reported
   */
  async createClaimFromIncident(
    tenant_id: string,
    incident_id: string,
    policy_id: string,
    user_id: string,
    claim_type: string = 'collision'
  ): Promise<InsuranceClaim> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get incident details
      const incidentResult = await client.query(
        `SELECT i.*, v.unit_number, d.first_name || ' ' || d.last_name as driver_name
         FROM incidents i
         LEFT JOIN vehicles v ON i.vehicle_id = v.id
         LEFT JOIN drivers d ON i.driver_id = d.id
         WHERE i.id = $1 AND i.tenant_id = $2`,
        [incident_id, tenant_id]
      );

      if (incidentResult.rows.length === 0) {
        throw new Error('Incident not found');
      }

      const incident = incidentResult.rows[0];

      // Generate claim number
      const numberResult = await client.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_num
         FROM insurance_claims WHERE tenant_id = $1`,
        [tenant_id]
      );
      const claim_number = `CLM-${String(numberResult.rows[0].next_num).padStart(6, '0')}`;

      // Create initial timeline
      const timeline: ClaimTimelineEvent[] = [
        {
          date: new Date().toISOString(),
          event: 'Claim Auto-Created',
          description: `Claim automatically created from incident ${incident.incident_number}`,
          user_id,
        },
      ];

      // Insert claim
      const claimResult = await client.query(
        `INSERT INTO insurance_claims (
          tenant_id, claim_number, incident_id, policy_id, claim_type,
          filed_date, filed_by, claim_amount_requested, status, timeline, documents
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, 'filed', $8, '[]')
        RETURNING *`,
        [
          tenant_id,
          claim_number,
          incident_id,
          policy_id,
          claim_type,
          user_id,
          incident.estimated_cost || 0,
          JSON.stringify(timeline),
        ]
      );

      // Update incident
      await client.query(
        `UPDATE incidents
         SET claim_filed = true, claim_id = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [claimResult.rows[0].id, incident_id, tenant_id]
      );

      await client.query('COMMIT');

      logger.info(`Auto-created claim ${claim_number} from incident ${incident.incident_number}`);
      return claimResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error auto-creating claim from incident:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Track claim status timeline
   * Adds a new event to the claim timeline
   */
  async addClaimTimelineEvent(
    claim_id: string,
    tenant_id: string,
    event: string,
    description: string,
    user_id?: string
  ): Promise<void> {
    try {
      const result = await this.pool.query(
        `SELECT timeline FROM insurance_claims WHERE id = $1 AND tenant_id = $2`,
        [claim_id, tenant_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Claim not found');
      }

      const timeline: ClaimTimelineEvent[] = result.rows[0].timeline || [];
      timeline.push({
        date: new Date().toISOString(),
        event,
        description,
        user_id,
      });

      await this.pool.query(
        `UPDATE insurance_claims
         SET timeline = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [JSON.stringify(timeline), claim_id, tenant_id]
      );

      logger.info(`Added timeline event to claim ${claim_id}: ${event}`);
    } catch (error) {
      logger.error('Error adding claim timeline event:', error);
      throw error;
    }
  }

  /**
   * Calculate loss ratios
   * Computes loss ratio (claims paid / premiums collected) for a time period
   */
  async calculateLossRatio(
    tenant_id: string,
    period_start: string,
    period_end: string
  ): Promise<LossRatio> {
    try {
      // Calculate total premiums paid
      const premiumResult = await this.pool.query(
        `SELECT SUM(premium_amount) as total_premiums
         FROM insurance_policies
         WHERE tenant_id = $1
           AND policy_start_date <= $2
           AND policy_end_date >= $3`,
        [tenant_id, period_end, period_start]
      );

      // Calculate total claims paid
      const claimsResult = await this.pool.query(
        `SELECT
           SUM(CASE WHEN payout_amount IS NOT NULL THEN payout_amount ELSE 0 END) as total_claims_paid,
           SUM(CASE WHEN status IN ('filed', 'under-review', 'approved') THEN claim_amount_requested ELSE 0 END) as total_claims_outstanding,
           COUNT(*) as claim_count,
           AVG(COALESCE(payout_amount, claim_amount_requested, 0)) as avg_claim_amount
         FROM insurance_claims
         WHERE tenant_id = $1
           AND filed_date >= $2
           AND filed_date <= $3`,
        [tenant_id, period_start, period_end]
      );

      const total_premiums_paid = parseFloat(premiumResult.rows[0].total_premiums || '0');
      const total_claims_paid = parseFloat(claimsResult.rows[0].total_claims_paid || '0');
      const total_claims_outstanding = parseFloat(
        claimsResult.rows[0].total_claims_outstanding || '0'
      );
      const claim_count = parseInt(claimsResult.rows[0].claim_count || '0', 10);
      const average_claim_amount = parseFloat(claimsResult.rows[0].avg_claim_amount || '0');

      const loss_ratio_percentage =
        total_premiums_paid > 0 ? (total_claims_paid / total_premiums_paid) * 100 : 0;

      return {
        period_start,
        period_end,
        total_premiums_paid,
        total_claims_paid,
        total_claims_outstanding,
        loss_ratio_percentage: parseFloat(loss_ratio_percentage.toFixed(2)),
        claim_count,
        average_claim_amount: parseFloat(average_claim_amount.toFixed(2)),
      };
    } catch (error) {
      logger.error('Error calculating loss ratio:', error);
      throw error;
    }
  }

  /**
   * Get expiration alerts
   * Returns policies expiring within specified days
   */
  async getExpirationAlerts(
    tenant_id: string,
    days_threshold: number = 30
  ): Promise<PolicyExpirationAlert[]> {
    try {
      const result = await this.pool.query(
        `SELECT
           ip.id as policy_id,
           ip.policy_number,
           ip.policy_type,
           ip.insurance_carrier,
           ip.policy_end_date as expiry_date,
           EXTRACT(DAY FROM (ip.policy_end_date - CURRENT_DATE)) as days_until_expiry,
           (SELECT COUNT(*) FROM vehicle_insurance_assignments
            WHERE policy_id = ip.id AND is_active = true) as covered_vehicle_count,
           (SELECT COUNT(*) FROM driver_insurance_assignments
            WHERE policy_id = ip.id AND is_active = true) as covered_driver_count
         FROM insurance_policies ip
         WHERE ip.tenant_id = $1
           AND ip.status = 'active'
           AND ip.policy_end_date <= CURRENT_DATE + INTERVAL '${days_threshold} days'
           AND ip.policy_end_date >= CURRENT_DATE
         ORDER BY ip.policy_end_date ASC`,
        [tenant_id]
      );

      return result.rows.map((row) => ({
        policy_id: row.policy_id,
        policy_number: row.policy_number,
        policy_type: row.policy_type,
        insurance_carrier: row.insurance_carrier,
        expiry_date: row.expiry_date.toISOString().split('T')[0],
        days_until_expiry: parseInt(row.days_until_expiry, 10),
        covered_vehicle_count: parseInt(row.covered_vehicle_count, 10),
        covered_driver_count: parseInt(row.covered_driver_count, 10),
      }));
    } catch (error) {
      logger.error('Error getting expiration alerts:', error);
      throw error;
    }
  }

  /**
   * Send expiration alerts (30/60/90 days)
   * This would integrate with notification service
   */
  async sendExpirationAlerts(tenant_id: string): Promise<void> {
    try {
      const thresholds = [30, 60, 90];

      for (const days of thresholds) {
        const alerts = await this.getExpirationAlerts(tenant_id, days);

        // Filter to only alerts matching exact threshold
        const exactAlerts = alerts.filter(
          (alert) => alert.days_until_expiry <= days && alert.days_until_expiry > days - 1
        );

        if (exactAlerts.length > 0) {
          logger.info(
            `Found ${exactAlerts.length} policies expiring in ~${days} days for tenant ${tenant_id}`
          );

          // TODO: Integrate with notification service
          // await notificationService.sendPolicyExpirationAlert(tenant_id, exactAlerts, days);

          for (const alert of exactAlerts) {
            logger.warn(
              `ALERT: Policy ${alert.policy_number} (${alert.policy_type}) expires in ${alert.days_until_expiry} days`
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error sending expiration alerts:', error);
      throw error;
    }
  }

  /**
   * Update claim status with workflow validation
   */
  async updateClaimStatus(
    claim_id: string,
    tenant_id: string,
    new_status: ClaimStatus,
    user_id: string,
    notes?: string
  ): Promise<InsuranceClaim> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get current claim
      const currentResult = await client.query(
        `SELECT * FROM insurance_claims WHERE id = $1 AND tenant_id = $2`,
        [claim_id, tenant_id]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Claim not found');
      }

      const currentClaim = currentResult.rows[0];

      // Validate status transition
      const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
        filed: ['under-review', 'denied', 'closed'],
        'under-review': ['approved', 'denied', 'closed'],
        approved: ['settled', 'closed'],
        denied: ['closed'],
        settled: ['closed'],
        closed: [],
      };

      const allowedStatuses = validTransitions[currentClaim.status as ClaimStatus] || [];
      if (!allowedStatuses.includes(new_status)) {
        throw new Error(
          `Invalid status transition from ${currentClaim.status} to ${new_status}`
        );
      }

      // Add timeline event
      const timeline: ClaimTimelineEvent[] = currentClaim.timeline || [];
      timeline.push({
        date: new Date().toISOString(),
        event: `Status changed to ${new_status}`,
        description: notes || `Claim status updated from ${currentClaim.status} to ${new_status}`,
        user_id,
      });

      // Update claim
      const updateResult = await client.query(
        `UPDATE insurance_claims
         SET status = $1, status_updated_at = NOW(), timeline = $2, updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4
         RETURNING *`,
        [new_status, JSON.stringify(timeline), claim_id, tenant_id]
      );

      await client.query('COMMIT');

      logger.info(`Updated claim ${currentClaim.claim_number} status: ${currentClaim.status} -> ${new_status}`);
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating claim status:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get claims summary for dashboard
   */
  async getClaimsSummary(tenant_id: string): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT
           COUNT(*) as total_claims,
           COUNT(*) FILTER (WHERE status = 'filed') as filed_claims,
           COUNT(*) FILTER (WHERE status = 'under-review') as under_review_claims,
           COUNT(*) FILTER (WHERE status = 'approved') as approved_claims,
           COUNT(*) FILTER (WHERE status = 'denied') as denied_claims,
           COUNT(*) FILTER (WHERE status = 'settled') as settled_claims,
           COUNT(*) FILTER (WHERE status = 'closed') as closed_claims,
           SUM(claim_amount_requested) as total_requested,
           SUM(claim_amount_approved) as total_approved,
           SUM(payout_amount) as total_paid,
           AVG(EXTRACT(DAY FROM (status_updated_at - created_at))) as avg_processing_days
         FROM insurance_claims
         WHERE tenant_id = $1`,
        [tenant_id]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting claims summary:', error);
      throw error;
    }
  }

  /**
   * Scheduled job: Check for expiring policies
   * Should be run daily via cron job
   */
  async checkExpiringPoliciesJob(): Promise<void> {
    try {
      // Get all tenants
      const tenantsResult = await this.pool.query('SELECT DISTINCT tenant_id FROM insurance_policies');

      for (const row of tenantsResult.rows) {
        await this.sendExpirationAlerts(row.tenant_id);
      }

      logger.info('Completed expiring policies check job');
    } catch (error) {
      logger.error('Error in expiring policies job:', error);
    }
  }

  /**
   * Scheduled job: Auto-update expired policies
   * Should be run daily via cron job
   */
  async autoUpdateExpiredPoliciesJob(): Promise<void> {
    try {
      const result = await this.pool.query(
        `UPDATE insurance_policies
         SET status = 'expired', updated_at = NOW()
         WHERE status = 'active'
           AND policy_end_date < CURRENT_DATE
         RETURNING id, policy_number, tenant_id`
      );

      if (result.rows.length > 0) {
        logger.info(`Auto-updated ${result.rows.length} expired policies`);
        result.rows.forEach((policy) => {
          logger.info(`  - Policy ${policy.policy_number} (tenant: ${policy.tenant_id})`);
        });
      }
    } catch (error) {
      logger.error('Error in auto-update expired policies job:', error);
    }
  }
}
