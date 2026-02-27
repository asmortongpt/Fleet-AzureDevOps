import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import { TYPES } from '../types';
import {
  ReconciliationResult,
  ReconciliationMatch,
  FraudAlert,
  FuelCardTransaction
} from '../types/fuel-cards';

/**
 * Fuel Card Reconciliation Service
 * Purpose: Auto-match fuel card transactions with actual fuel_transactions
 * Implements intelligent matching algorithms and fraud detection
 */
@injectable()
export class FuelCardReconciliationService {
  constructor(@inject(TYPES.DatabasePool) private db: Pool) {}

  /**
   * Auto-reconcile pending fuel card transactions
   * Matches based on: vehicle, date (within 24h), gallons (within 10%), amount (within 10%)
   */
  async reconcilePendingTransactions(tenantId: string): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      processed_count: 0,
      matched_count: 0,
      unmatched_count: 0,
      matches: [],
      unmatched_transactions: [],
      errors: []
    };

    try {
      // Get all pending fuel card transactions
      const pendingQuery = `
        SELECT * FROM fuel_card_transactions
        WHERE tenant_id = $1
          AND reconciliation_status = 'pending'
        ORDER BY transaction_date DESC
      `;
      const pendingResult = await this.db.query(pendingQuery, [tenantId]);
      const pendingTransactions = pendingResult.rows;

      result.processed_count = pendingTransactions.length;

      for (const fct of pendingTransactions) {
        try {
          const match = await this.findMatchingFuelTransaction(fct, tenantId);

          if (match) {
            // Found a match - link them together
            await this.linkTransactions(fct.id, match.fuel_transaction_id, match, tenantId);
            result.matched_count++;
            result.matches.push(match);
          } else {
            // No match found - mark as unmatched
            await this.markAsUnmatched(fct.id, tenantId);
            result.unmatched_count++;
            result.unmatched_transactions.push(fct.id);
          }
        } catch (error: unknown) {
          result.errors.push({
            transaction_id: fct.id,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
        }
      }

      return result;
    } catch (error: unknown) {
      throw new Error(`Reconciliation failed: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
    }
  }

  /**
   * Find matching fuel_transaction for a fuel card transaction
   */
  private async findMatchingFuelTransaction(
    fct: FuelCardTransaction,
    tenantId: string
  ): Promise<ReconciliationMatch | null> {
    // Search for fuel_transactions that match criteria
    const query = `
      SELECT
        ft.id,
        ft.vehicle_id,
        ft.transaction_date,
        ft.gallons,
        ft.total_cost,
        ft.latitude,
        ft.longitude,
        -- Calculate match score components
        CASE
          WHEN ft.vehicle_id = $2 THEN 40 -- Vehicle match is critical
          ELSE 0
        END +
        CASE
          WHEN ABS(EXTRACT(EPOCH FROM (ft.transaction_date - $3::timestamptz)) / 3600) <= 24 THEN 30 -- Within 24 hours
          WHEN ABS(EXTRACT(EPOCH FROM (ft.transaction_date - $3::timestamptz)) / 3600) <= 48 THEN 15 -- Within 48 hours
          ELSE 0
        END +
        CASE
          WHEN ABS(ft.gallons - $4) / NULLIF($4, 0) <= 0.10 THEN 20 -- Within 10% gallons
          WHEN ABS(ft.gallons - $4) / NULLIF($4, 0) <= 0.20 THEN 10 -- Within 20% gallons
          ELSE 0
        END +
        CASE
          WHEN ABS(ft.total_cost - $5) / NULLIF($5, 0) <= 0.10 THEN 10 -- Within 10% cost
          WHEN ABS(ft.total_cost - $5) / NULLIF($5, 0) <= 0.20 THEN 5 -- Within 20% cost
          ELSE 0
        END as match_score
      FROM fuel_transactions ft
      WHERE ft.tenant_id = $1
        AND ft.is_reconciled = false
        AND ft.vehicle_id = $2 -- Must match vehicle
        AND ABS(EXTRACT(EPOCH FROM (ft.transaction_date - $3::timestamptz)) / 3600) <= 48 -- Within 48 hours window
        AND ABS(ft.gallons - $4) / NULLIF($4, 0) <= 0.25 -- Within 25% gallons (broader search)
        AND ABS(ft.total_cost - $5) / NULLIF($5, 0) <= 0.25 -- Within 25% cost (broader search)
      ORDER BY match_score DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [
      tenantId,
      fct.vehicle_id,
      fct.transaction_date,
      fct.gallons,
      fct.total_cost
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    const ft = result.rows[0];
    const matchScore = ft.match_score;

    // Require minimum score of 60 for auto-match
    if (matchScore < 60) {
      return null;
    }

    // Build match factors
    const match_factors = {
      vehicle_match: ft.vehicle_id === fct.vehicle_id,
      date_match: Math.abs(new Date(ft.transaction_date).getTime() - new Date(fct.transaction_date).getTime()) / (1000 * 60 * 60) <= 24,
      gallons_match: Math.abs(ft.gallons - fct.gallons) / fct.gallons <= 0.10,
      amount_match: Math.abs(ft.total_cost - fct.total_cost) / fct.total_cost <= 0.10,
      location_match: this.isLocationMatch(fct, ft)
    };

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (matchScore >= 90) {
      confidence = 'high';
    } else if (matchScore >= 70) {
      confidence = 'medium';
    }

    return {
      fuel_card_transaction_id: fct.id,
      fuel_transaction_id: ft.id,
      match_score: matchScore,
      match_factors,
      confidence
    };
  }

  /**
   * Check if locations are close enough (within ~50 miles)
   */
  private isLocationMatch(fct: FuelCardTransaction, ft: any): boolean {
    if (!fct.latitude || !fct.longitude || !ft.latitude || !ft.longitude) {
      return false; // Can't determine without coordinates
    }

    // Simple distance calculation (Haversine would be more accurate)
    const latDiff = Math.abs(fct.latitude - ft.latitude);
    const lonDiff = Math.abs(fct.longitude - ft.longitude);
    const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

    // Rough approximation: 1 degree ≈ 69 miles
    return distance < 0.7; // ~50 miles
  }

  /**
   * Link fuel card transaction with fuel transaction
   */
  private async linkTransactions(
    fctId: string,
    ftId: string,
    match: ReconciliationMatch,
    tenantId: string
  ): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Update fuel_card_transaction
      await client.query(
        `UPDATE fuel_card_transactions
         SET reconciliation_status = 'matched',
             reconciled_with_fuel_transaction_id = $1,
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{reconciliation}',
               $2::jsonb
             ),
             updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4`,
        [
          ftId,
          JSON.stringify({
            match_score: match.match_score,
            confidence: match.confidence,
            matched_at: new Date().toISOString()
          }),
          fctId,
          tenantId
        ]
      );

      // Update fuel_transaction
      await client.query(
        `UPDATE fuel_transactions
         SET is_reconciled = true,
             reconciliation_notes = $1
         WHERE id = $2 AND tenant_id = $3`,
        [
          `Auto-matched with fuel card transaction ${fctId} (score: ${match.match_score}, confidence: ${match.confidence})`,
          ftId,
          tenantId
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark transaction as unmatched
   */
  private async markAsUnmatched(fctId: string, tenantId: string): Promise<void> {
    await this.db.query(
      `UPDATE fuel_card_transactions
       SET reconciliation_status = 'unmatched',
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{reconciliation}',
             $1::jsonb
           ),
           updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [
        JSON.stringify({
          checked_at: new Date().toISOString(),
          reason: 'No matching fuel_transaction found within matching criteria'
        }),
        fctId,
        tenantId
      ]
    );
  }

  /**
   * Detect fraud patterns in fuel card transactions
   */
  async detectFraud(tenantId: string, vehicleId?: string): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    // 1. Unusual location - transaction far from vehicle's typical routes
    const unusualLocationQuery = `
      WITH vehicle_typical_locations AS (
        SELECT
          vehicle_id,
          AVG(latitude) as avg_lat,
          AVG(longitude) as avg_lon
        FROM fuel_card_transactions
        WHERE tenant_id = $1
          AND vehicle_id IS NOT NULL
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND transaction_date > NOW() - INTERVAL '90 days'
        GROUP BY vehicle_id
      )
      SELECT
        fct.id,
        fct.vehicle_id,
        fct.transaction_date,
        fct.location,
        fct.total_cost,
        SQRT(
          POW(fct.latitude - vtl.avg_lat, 2) +
          POW(fct.longitude - vtl.avg_lon, 2)
        ) * 69 as distance_miles
      FROM fuel_card_transactions fct
      JOIN vehicle_typical_locations vtl ON fct.vehicle_id = vtl.vehicle_id
      WHERE fct.tenant_id = $1
        AND fct.transaction_date > NOW() - INTERVAL '7 days'
        AND SQRT(
          POW(fct.latitude - vtl.avg_lat, 2) +
          POW(fct.longitude - vtl.avg_lon, 2)
        ) * 69 > 100 -- More than 100 miles from typical location
    `;

    const unusualResult = await this.db.query(unusualLocationQuery, [tenantId]);
    for (const row of unusualResult.rows) {
      alerts.push({
        transaction_id: row.id,
        alert_type: 'unusual_location',
        severity: row.distance_miles > 500 ? 'critical' : 'high',
        description: `Transaction ${row.distance_miles.toFixed(0)} miles from typical location`,
        details: {
          vehicle_id: row.vehicle_id,
          transaction_date: row.transaction_date,
          location: row.location,
          distance_miles: row.distance_miles
        },
        created_at: new Date()
      });
    }

    // 2. Excessive fill - transaction exceeds typical tank capacity
    const excessiveFillQuery = `
      SELECT
        fct.id,
        fct.vehicle_id,
        fct.gallons,
        fct.total_cost,
        fct.transaction_date
      FROM fuel_card_transactions fct
      WHERE fct.tenant_id = $1
        AND fct.transaction_date > NOW() - INTERVAL '7 days'
        AND fct.gallons > 50 -- Threshold for excessive fill (adjustable)
    `;

    const excessiveResult = await this.db.query(excessiveFillQuery, [tenantId]);
    for (const row of excessiveResult.rows) {
      alerts.push({
        transaction_id: row.id,
        alert_type: 'excessive_fill',
        severity: row.gallons > 100 ? 'critical' : 'medium',
        description: `Unusually large fill: ${row.gallons} gallons`,
        details: {
          vehicle_id: row.vehicle_id,
          gallons: row.gallons,
          total_cost: row.total_cost
        },
        created_at: new Date()
      });
    }

    // 3. Rapid succession - multiple transactions within short time for same card
    const rapidSuccessionQuery = `
      WITH transaction_gaps AS (
        SELECT
          id,
          fuel_card_id,
          transaction_date,
          total_cost,
          LAG(transaction_date) OVER (PARTITION BY fuel_card_id ORDER BY transaction_date) as prev_date,
          EXTRACT(EPOCH FROM (
            transaction_date - LAG(transaction_date) OVER (PARTITION BY fuel_card_id ORDER BY transaction_date)
          )) / 3600 as hours_since_last
        FROM fuel_card_transactions
        WHERE tenant_id = $1
          AND transaction_date > NOW() - INTERVAL '7 days'
      )
      SELECT * FROM transaction_gaps
      WHERE hours_since_last < 1 AND hours_since_last IS NOT NULL
    `;

    const rapidResult = await this.db.query(rapidSuccessionQuery, [tenantId]);
    for (const row of rapidResult.rows) {
      alerts.push({
        transaction_id: row.id,
        alert_type: 'rapid_succession',
        severity: 'high',
        description: `Transaction within ${row.hours_since_last.toFixed(1)} hours of previous transaction`,
        details: {
          fuel_card_id: row.fuel_card_id,
          hours_since_last: row.hours_since_last,
          total_cost: row.total_cost
        },
        created_at: new Date()
      });
    }

    // 4. Duplicate transaction detection
    const duplicateQuery = `
      SELECT
        fct1.id,
        fct1.fuel_card_id,
        fct1.transaction_date,
        fct1.total_cost,
        COUNT(*) as duplicate_count
      FROM fuel_card_transactions fct1
      JOIN fuel_card_transactions fct2
        ON fct1.fuel_card_id = fct2.fuel_card_id
        AND fct1.id != fct2.id
        AND ABS(EXTRACT(EPOCH FROM (fct1.transaction_date - fct2.transaction_date))) < 60 -- Within 1 minute
        AND ABS(fct1.total_cost - fct2.total_cost) < 0.10 -- Same amount
      WHERE fct1.tenant_id = $1
        AND fct1.transaction_date > NOW() - INTERVAL '7 days'
      GROUP BY fct1.id, fct1.fuel_card_id, fct1.transaction_date, fct1.total_cost
      HAVING COUNT(*) > 1
    `;

    const duplicateResult = await this.db.query(duplicateQuery, [tenantId]);
    for (const row of duplicateResult.rows) {
      alerts.push({
        transaction_id: row.id,
        alert_type: 'duplicate_transaction',
        severity: 'critical',
        description: `Potential duplicate transaction detected`,
        details: {
          fuel_card_id: row.fuel_card_id,
          duplicate_count: row.duplicate_count,
          total_cost: row.total_cost
        },
        created_at: new Date()
      });
    }

    return alerts;
  }

  /**
   * Manual reconciliation - admin links transactions manually
   */
  async manualReconcile(
    fctId: string,
    ftId: string,
    tenantId: string,
    userId: string
  ): Promise<void> {
    const match: ReconciliationMatch = {
      fuel_card_transaction_id: fctId,
      fuel_transaction_id: ftId,
      match_score: 100, // Manual match gets perfect score
      match_factors: {
        vehicle_match: true,
        date_match: true,
        gallons_match: true,
        amount_match: true
      },
      confidence: 'high'
    };

    await this.linkTransactions(fctId, ftId, match, tenantId);
  }

  /**
   * Dispute a transaction
   */
  async disputeTransaction(
    fctId: string,
    reason: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    await this.db.query(
      `UPDATE fuel_card_transactions
       SET is_disputed = true,
           dispute_reason = $1,
           disputed_by = $2,
           disputed_at = NOW(),
           reconciliation_status = 'disputed',
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4`,
      [reason, userId, fctId, tenantId]
    );
  }
}
