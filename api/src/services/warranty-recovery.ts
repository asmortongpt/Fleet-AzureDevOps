/**
 * Warranty Claims Recovery Service
 *
 * Track claim submission, monitor claim status, calculate recovery rate,
 * and generate recovery reports
 *
 * @module services/warranty-recovery
 * @author Claude Code - Agent 7 (Phase 3)
 * @date 2026-02-02
 */

import { Pool } from 'pg';
import {
    WarrantyClaim,
    WarrantyClaimStatus,
    WarrantyRecoveryReport,
    WarrantyStatistics
} from '../types/warranties';

export class WarrantyRecoveryService {
    constructor(private db: Pool) {}

    /**
     * Track claim submission
     */
    async trackClaimSubmission(
        tenantId: string,
        claimId: string
    ): Promise<{
        success: boolean;
        claim: WarrantyClaim;
        timeline_event: { date: Date; event: string; description: string };
    }> {
        const client = await this.db.connect();

        try {
            await client.query('BEGIN');

            // Get current claim
            const claimResult = await client.query<WarrantyClaim>(
                `SELECT * FROM warranty_claims WHERE id = $1 AND tenant_id = $2`,
                [claimId, tenantId]
            );

            if (claimResult.rows.length === 0) {
                throw new Error('Warranty claim not found');
            }

            const claim = claimResult.rows[0];

            // Add timeline event
            const timeline = claim.timeline || [];
            const newEvent = {
                date: new Date(),
                event: 'Claim Submitted',
                description: `Claim ${claim.claim_number} submitted for review`
            };
            timeline.push(newEvent);

            // Update claim status to submitted if not already
            await client.query(
                `UPDATE warranty_claims
                 SET status = $1,
                     timeline = $2,
                     updated_at = NOW()
                 WHERE id = $3 AND tenant_id = $4`,
                [WarrantyClaimStatus.SUBMITTED, JSON.stringify(timeline), claimId, tenantId]
            );

            await client.query('COMMIT');

            return {
                success: true,
                claim: { ...claim, status: WarrantyClaimStatus.SUBMITTED, timeline },
                timeline_event: newEvent
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Monitor claim status and update
     */
    async updateClaimStatus(
        tenantId: string,
        claimId: string,
        newStatus: WarrantyClaimStatus,
        details: {
            approved_amount?: number;
            denied_amount?: number;
            payout_amount?: number;
            payout_date?: Date;
            denial_reason?: string;
            authorization_number?: string;
            notes?: string;
        } = {}
    ): Promise<WarrantyClaim> {
        const client = await this.db.connect();

        try {
            await client.query('BEGIN');

            // Get current claim
            const claimResult = await client.query<WarrantyClaim>(
                `SELECT * FROM warranty_claims WHERE id = $1 AND tenant_id = $2`,
                [claimId, tenantId]
            );

            if (claimResult.rows.length === 0) {
                throw new Error('Warranty claim not found');
            }

            const claim = claimResult.rows[0];

            // Build timeline event
            const timeline = claim.timeline || [];
            let eventDescription = `Status changed to ${newStatus}`;

            if (newStatus === WarrantyClaimStatus.APPROVED && details.approved_amount) {
                eventDescription += ` - Approved for $${details.approved_amount.toFixed(2)}`;
            } else if (newStatus === WarrantyClaimStatus.DENIED && details.denial_reason) {
                eventDescription += ` - Reason: ${details.denial_reason}`;
            } else if (newStatus === WarrantyClaimStatus.PAID && details.payout_amount) {
                eventDescription += ` - Payout of $${details.payout_amount.toFixed(2)} processed`;
            }

            timeline.push({
                date: new Date(),
                event: `Status: ${newStatus}`,
                description: eventDescription
            });

            // Update claim
            const updateFields: string[] = ['status = $1', 'timeline = $2', 'updated_at = NOW()'];
            const updateValues: any[] = [newStatus, JSON.stringify(timeline)];
            let paramIndex = 3;

            if (details.approved_amount !== undefined) {
                updateFields.push(`approved_amount = $${paramIndex++}`);
                updateValues.push(details.approved_amount);
                updateFields.push(`approval_date = $${paramIndex++}`);
                updateValues.push(new Date());
            }

            if (details.denied_amount !== undefined) {
                updateFields.push(`denied_amount = $${paramIndex++}`);
                updateValues.push(details.denied_amount);
                updateFields.push(`denial_date = $${paramIndex++}`);
                updateValues.push(new Date());
            }

            if (details.denial_reason) {
                updateFields.push(`denial_reason = $${paramIndex++}`);
                updateValues.push(details.denial_reason);
            }

            if (details.payout_amount !== undefined) {
                updateFields.push(`payout_amount = $${paramIndex++}`);
                updateValues.push(details.payout_amount);
            }

            if (details.payout_date) {
                updateFields.push(`payout_date = $${paramIndex++}`);
                updateValues.push(details.payout_date);
            }

            if (details.authorization_number) {
                updateFields.push(`authorization_number = $${paramIndex++}`);
                updateValues.push(details.authorization_number);
            }

            if (details.notes) {
                updateFields.push(`notes = $${paramIndex++}`);
                updateValues.push(details.notes);
            }

            updateValues.push(claimId, tenantId);

            const result = await client.query<WarrantyClaim>(
                `UPDATE warranty_claims
                 SET ${updateFields.join(', ')}
                 WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
                 RETURNING *`,
                updateValues
            );

            await client.query('COMMIT');

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Calculate recovery rate for a tenant
     */
    async calculateRecoveryRate(
        tenantId: string,
        periodStart?: Date,
        periodEnd?: Date
    ): Promise<{
        total_claimed: number;
        total_recovered: number;
        recovery_rate: number; // percentage
        claim_count: number;
        paid_claim_count: number;
    }> {
        let query = `
            SELECT
                COUNT(*)::integer as claim_count,
                COUNT(*) FILTER (WHERE status = 'paid')::integer as paid_claim_count,
                COALESCE(SUM(claim_amount), 0)::numeric as total_claimed,
                COALESCE(SUM(payout_amount) FILTER (WHERE status = 'paid'), 0)::numeric as total_recovered
            FROM warranty_claims
            WHERE tenant_id = $1
        `;

        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (periodStart) {
            query += ` AND claim_date >= $${paramIndex++}`;
            params.push(periodStart);
        }

        if (periodEnd) {
            query += ` AND claim_date <= $${paramIndex++}`;
            params.push(periodEnd);
        }

        const result = await this.db.query(query, params);
        const data = result.rows[0];

        const totalClaimed = parseFloat(data.total_claimed) || 0;
        const totalRecovered = parseFloat(data.total_recovered) || 0;
        const recoveryRate = totalClaimed > 0 ? (totalRecovered / totalClaimed) * 100 : 0;

        return {
            total_claimed: totalClaimed,
            total_recovered: totalRecovered,
            recovery_rate: Math.round(recoveryRate * 100) / 100,
            claim_count: data.claim_count || 0,
            paid_claim_count: data.paid_claim_count || 0
        };
    }

    /**
     * Generate comprehensive recovery report
     */
    async generateRecoveryReport(
        tenantId: string,
        periodStart: Date,
        periodEnd: Date
    ): Promise<WarrantyRecoveryReport> {
        const client = await this.db.connect();

        try {
            // Overall statistics
            const statsQuery = `
                SELECT
                    COUNT(*)::integer as claims_filed,
                    COUNT(*) FILTER (WHERE status = 'approved')::integer as claims_approved,
                    COUNT(*) FILTER (WHERE status = 'denied')::integer as claims_denied,
                    COUNT(*) FILTER (WHERE status = 'paid')::integer as claims_paid,
                    COALESCE(SUM(claim_amount), 0)::numeric as total_claimed,
                    COALESCE(SUM(approved_amount), 0)::numeric as total_approved,
                    COALESCE(SUM(denied_amount), 0)::numeric as total_denied,
                    COALESCE(SUM(payout_amount) FILTER (WHERE status = 'paid'), 0)::numeric as total_recovered,
                    COALESCE(AVG(EXTRACT(EPOCH FROM (approval_date - claim_date))/86400) FILTER (WHERE approval_date IS NOT NULL), 0)::numeric as avg_days_to_approval,
                    COALESCE(AVG(EXTRACT(EPOCH FROM (payout_date - claim_date))/86400) FILTER (WHERE payout_date IS NOT NULL), 0)::numeric as avg_days_to_payout
                FROM warranty_claims
                WHERE tenant_id = $1
                  AND claim_date BETWEEN $2 AND $3
            `;

            const stats = await client.query(statsQuery, [tenantId, periodStart, periodEnd]);
            const s = stats.rows[0];

            const totalClaimed = parseFloat(s.total_claimed) || 0;
            const totalRecovered = parseFloat(s.total_recovered) || 0;
            const recoveryRate = totalClaimed > 0 ? (totalRecovered / totalClaimed) * 100 : 0;
            const approvalRate = s.claims_filed > 0 ? (s.claims_approved / s.claims_filed) * 100 : 0;

            // Top components by recovery amount
            const topComponentsQuery = `
                SELECT
                    failed_component as component,
                    COUNT(*)::integer as claims_count,
                    COALESCE(SUM(payout_amount), 0)::numeric as total_recovered
                FROM warranty_claims
                WHERE tenant_id = $1
                  AND claim_date BETWEEN $2 AND $3
                  AND failed_component IS NOT NULL
                  AND status = 'paid'
                GROUP BY failed_component
                ORDER BY total_recovered DESC
                LIMIT 10
            `;

            const topComponents = await client.query(topComponentsQuery, [tenantId, periodStart, periodEnd]);

            // Top warranties by recovery amount
            const topWarrantiesQuery = `
                SELECT
                    wc.warranty_id,
                    w.warranty_number,
                    w.warranty_type,
                    COUNT(*)::integer as claims_count,
                    COALESCE(SUM(wc.payout_amount), 0)::numeric as total_recovered
                FROM warranty_claims wc
                JOIN warranties w ON wc.warranty_id = w.id
                WHERE wc.tenant_id = $1
                  AND wc.claim_date BETWEEN $2 AND $3
                  AND wc.status = 'paid'
                GROUP BY wc.warranty_id, w.warranty_number, w.warranty_type
                ORDER BY total_recovered DESC
                LIMIT 10
            `;

            const topWarranties = await client.query(topWarrantiesQuery, [tenantId, periodStart, periodEnd]);

            return {
                period_start: periodStart,
                period_end: periodEnd,
                claims_filed: s.claims_filed || 0,
                claims_approved: s.claims_approved || 0,
                claims_denied: s.claims_denied || 0,
                claims_paid: s.claims_paid || 0,
                total_claimed: totalClaimed,
                total_approved: parseFloat(s.total_approved) || 0,
                total_denied: parseFloat(s.total_denied) || 0,
                total_recovered: totalRecovered,
                recovery_rate: Math.round(recoveryRate * 100) / 100,
                approval_rate: Math.round(approvalRate * 100) / 100,
                avg_days_to_approval: Math.round(parseFloat(s.avg_days_to_approval) || 0),
                avg_days_to_payout: Math.round(parseFloat(s.avg_days_to_payout) || 0),
                top_components: topComponents.rows.map(r => ({
                    component: r.component,
                    claims_count: r.claims_count,
                    total_recovered: parseFloat(r.total_recovered)
                })),
                top_warranties: topWarranties.rows.map(r => ({
                    warranty_id: r.warranty_id,
                    warranty_number: r.warranty_number,
                    warranty_type: r.warranty_type,
                    claims_count: r.claims_count,
                    total_recovered: parseFloat(r.total_recovered)
                }))
            };
        } finally {
            client.release();
        }
    }

    /**
     * Get warranty statistics for dashboard
     */
    async getWarrantyStatistics(tenantId: string): Promise<WarrantyStatistics> {
        const client = await this.db.connect();

        try {
            // Warranty statistics
            const warrantyStats = await client.query(`
                SELECT
                    COUNT(*)::integer as total_warranties,
                    COUNT(*) FILTER (WHERE status = 'active')::integer as active_warranties,
                    COUNT(*) FILTER (WHERE status = 'expired')::integer as expired_warranties,
                    COALESCE(SUM(claims_filed), 0)::integer as total_claims_filed,
                    COALESCE(SUM(claims_approved), 0)::integer as total_claims_approved,
                    COALESCE(SUM(total_claimed), 0)::numeric as total_claimed_amount,
                    COALESCE(SUM(total_recovered), 0)::numeric as total_recovered_amount
                FROM warranties
                WHERE tenant_id = $1
            `, [tenantId]);

            const ws = warrantyStats.rows[0];

            // Warranties by type
            const byType = await client.query(`
                SELECT warranty_type, COUNT(*)::integer as count
                FROM warranties
                WHERE tenant_id = $1 AND status = 'active'
                GROUP BY warranty_type
            `, [tenantId]);

            const warranties_by_type: Record<string, number> = {};
            byType.rows.forEach(row => {
                warranties_by_type[row.warranty_type] = row.count;
            });

            // Claims statistics
            const claimStats = await client.query(`
                SELECT
                    COUNT(*) FILTER (WHERE status = 'denied')::integer as total_claims_denied,
                    COALESCE(AVG(claim_amount) FILTER (WHERE status IN ('approved', 'paid')), 0)::numeric as avg_claim_amount,
                    COALESCE(AVG(payout_amount) FILTER (WHERE status = 'paid'), 0)::numeric as avg_payout_amount
                FROM warranty_claims
                WHERE tenant_id = $1
            `, [tenantId]);

            const cs = claimStats.rows[0];

            // Claims by status
            const byStatus = await client.query(`
                SELECT status, COUNT(*)::integer as count
                FROM warranty_claims
                WHERE tenant_id = $1
                GROUP BY status
            `, [tenantId]);

            const claims_by_status: Record<string, number> = {};
            byStatus.rows.forEach(row => {
                claims_by_status[row.status] = row.count;
            });

            const totalClaimed = parseFloat(ws.total_claimed_amount) || 0;
            const totalRecovered = parseFloat(ws.total_recovered_amount) || 0;
            const recoveryRate = totalClaimed > 0 ? (totalRecovered / totalClaimed) * 100 : 0;

            return {
                total_warranties: ws.total_warranties || 0,
                active_warranties: ws.active_warranties || 0,
                expired_warranties: ws.expired_warranties || 0,
                total_claims_filed: ws.total_claims_filed || 0,
                total_claims_approved: ws.total_claims_approved || 0,
                total_claims_denied: cs.total_claims_denied || 0,
                total_claimed_amount: totalClaimed,
                total_recovered_amount: totalRecovered,
                recovery_rate: Math.round(recoveryRate * 100) / 100,
                avg_claim_amount: parseFloat(cs.avg_claim_amount) || 0,
                avg_payout_amount: parseFloat(cs.avg_payout_amount) || 0,
                warranties_by_type: warranties_by_type,
                claims_by_status: claims_by_status
            };
        } finally {
            client.release();
        }
    }

    /**
     * Get pending claims (submitted or under review)
     */
    async getPendingClaims(tenantId: string): Promise<WarrantyClaim[]> {
        const result = await this.db.query<WarrantyClaim>(`
            SELECT * FROM warranty_claims
            WHERE tenant_id = $1
              AND status IN ('submitted', 'under-review')
            ORDER BY claim_date ASC
        `, [tenantId]);

        return result.rows;
    }

    /**
     * Alert on stale claims (submitted > 30 days ago with no update)
     */
    async getStaleClaims(tenantId: string, daysThreshold: number = 30): Promise<WarrantyClaim[]> {
        const result = await this.db.query<WarrantyClaim>(`
            SELECT * FROM warranty_claims
            WHERE tenant_id = $1
              AND status IN ('submitted', 'under-review')
              AND claim_date < CURRENT_DATE - $2
            ORDER BY claim_date ASC
        `, [tenantId, daysThreshold]);

        return result.rows;
    }
}

export default WarrantyRecoveryService;
