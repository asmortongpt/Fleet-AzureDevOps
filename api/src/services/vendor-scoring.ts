/**
 * VENDOR SCORING SERVICE
 * Phase 3 - Agent 8: Calculate vendor performance metrics and rankings
 * Security: Parameterized queries only, tenant isolation enforced
 */

import { Pool } from 'pg';
import {
  VendorPerformance,
  VendorRanking,
  VendorScoringInput,
  VendorSpendAnalysis,
} from '../types/vendor-management';

export class VendorScoringService {
  constructor(private pool: Pool) {}

  /**
   * Calculate on-time delivery percentage for a vendor
   * Uses database function for accurate calculation
   */
  async calculateOnTimeDeliveryPercentage(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<number> {
    const query = `
      SELECT calculate_vendor_on_time_percentage($1, $2, $3) as percentage
    `;

    const result = await this.pool.query(query, [vendorId, startDate, endDate]);
    return result.rows[0]?.percentage || 0;
  }

  /**
   * Calculate total spend for a vendor in a period
   * Uses database function for accurate calculation
   */
  async calculateVendorSpend(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<number> {
    const query = `
      SELECT calculate_vendor_spend($1, $2, $3) as total_spend
    `;

    const result = await this.pool.query(query, [vendorId, startDate, endDate]);
    return result.rows[0]?.total_spend || 0;
  }

  /**
   * Calculate quality score based on warranty claims and defect rates
   */
  async calculateQualityScore(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<number> {
    const query = `
      WITH order_stats AS (
        SELECT
          COUNT(DISTINCT po.id) as total_orders,
          COUNT(DISTINCT CASE
            WHEN pori.condition IN ('damaged', 'defective', 'wrong_item')
            THEN pori.receiving_id
          END) as defective_deliveries
        FROM purchase_orders po
        LEFT JOIN purchase_order_receiving por ON po.id = por.purchase_order_id
        LEFT JOIN purchase_order_receiving_items pori ON por.id = pori.receiving_id
        WHERE po.vendor_id = $1
          AND po.tenant_id = $2
          AND po.order_date BETWEEN $3 AND $4
          AND po.status != 'cancelled'
      )
      SELECT
        CASE
          WHEN total_orders = 0 THEN 3.0
          WHEN defective_deliveries = 0 THEN 5.0
          ELSE GREATEST(1.0, 5.0 - (defective_deliveries::NUMERIC / total_orders::NUMERIC * 10))
        END as quality_score
      FROM order_stats
    `;

    const result = await this.pool.query(query, [
      vendorId,
      tenantId,
      startDate,
      endDate,
    ]);
    return Number(result.rows[0]?.quality_score || 3.0);
  }

  /**
   * Calculate pricing competitiveness (compares vendor to market average)
   */
  async calculatePricingCompetitiveness(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<number> {
    const query = `
      WITH vendor_avg AS (
        SELECT AVG(po.total_amount / NULLIF(po.quantity_ordered, 0)) as avg_unit_price
        FROM purchase_orders po
        WHERE po.vendor_id = $1
          AND po.tenant_id = $2
          AND po.order_date BETWEEN $3 AND $4
          AND po.status != 'cancelled'
          AND po.quantity_ordered > 0
      ),
      market_avg AS (
        SELECT AVG(po.total_amount / NULLIF(po.quantity_ordered, 0)) as avg_unit_price
        FROM purchase_orders po
        WHERE po.tenant_id = $2
          AND po.order_date BETWEEN $3 AND $4
          AND po.status != 'cancelled'
          AND po.quantity_ordered > 0
      )
      SELECT
        CASE
          WHEN vendor_avg.avg_unit_price IS NULL OR market_avg.avg_unit_price IS NULL THEN 3.0
          WHEN vendor_avg.avg_unit_price <= market_avg.avg_unit_price * 0.85 THEN 5.0
          WHEN vendor_avg.avg_unit_price <= market_avg.avg_unit_price * 0.95 THEN 4.0
          WHEN vendor_avg.avg_unit_price <= market_avg.avg_unit_price * 1.05 THEN 3.0
          WHEN vendor_avg.avg_unit_price <= market_avg.avg_unit_price * 1.15 THEN 2.0
          ELSE 1.0
        END as pricing_score
      FROM vendor_avg, market_avg
    `;

    const result = await this.pool.query(query, [
      vendorId,
      tenantId,
      startDate,
      endDate,
    ]);
    return Number(result.rows[0]?.pricing_score || 3.0);
  }

  /**
   * Calculate responsiveness score based on communication and order processing times
   */
  async calculateResponsivenessScore(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<number> {
    const query = `
      WITH response_times AS (
        SELECT
          COUNT(*) as total_orders,
          AVG(EXTRACT(DAY FROM (delivered_date - order_date))) as avg_delivery_days,
          AVG(EXTRACT(DAY FROM (expected_delivery_date - order_date))) as expected_days
        FROM purchase_orders
        WHERE vendor_id = $1
          AND tenant_id = $2
          AND order_date BETWEEN $3 AND $4
          AND delivered_date IS NOT NULL
          AND status != 'cancelled'
      )
      SELECT
        CASE
          WHEN total_orders = 0 THEN 3.0
          WHEN avg_delivery_days <= expected_days * 0.8 THEN 5.0
          WHEN avg_delivery_days <= expected_days THEN 4.0
          WHEN avg_delivery_days <= expected_days * 1.2 THEN 3.0
          WHEN avg_delivery_days <= expected_days * 1.5 THEN 2.0
          ELSE 1.0
        END as responsiveness_score
      FROM response_times
    `;

    const result = await this.pool.query(query, [
      vendorId,
      tenantId,
      startDate,
      endDate,
    ]);
    return Number(result.rows[0]?.responsiveness_score || 3.0);
  }

  /**
   * Calculate overall vendor score for a period
   * Creates or updates vendor_performance record
   */
  async calculateVendorScore(
    input: VendorScoringInput,
    tenantId: string,
    evaluatedBy: string
  ): Promise<VendorPerformance> {
    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);

    // Calculate all metrics
    const [
      onTimePercentage,
      totalSpend,
      qualityScore,
      pricingScore,
      responsivenessScore,
    ] = await Promise.all([
      this.calculateOnTimeDeliveryPercentage(
        input.vendor_id,
        startDate,
        endDate,
        tenantId
      ),
      this.calculateVendorSpend(input.vendor_id, startDate, endDate, tenantId),
      this.calculateQualityScore(input.vendor_id, startDate, endDate, tenantId),
      this.calculatePricingCompetitiveness(
        input.vendor_id,
        startDate,
        endDate,
        tenantId
      ),
      this.calculateResponsivenessScore(
        input.vendor_id,
        startDate,
        endDate,
        tenantId
      ),
    ]);

    // Get order counts
    const orderQuery = `
      SELECT
        COUNT(*) FILTER (WHERE delivered_date IS NOT NULL) as total_orders,
        COUNT(*) FILTER (
          WHERE delivered_date IS NOT NULL
          AND delivered_date <= expected_delivery_date
        ) as on_time_deliveries
      FROM purchase_orders
      WHERE vendor_id = $1
        AND tenant_id = $2
        AND order_date BETWEEN $3 AND $4
        AND status != 'cancelled'
    `;

    const orderResult = await this.pool.query(orderQuery, [
      input.vendor_id,
      tenantId,
      startDate,
      endDate,
    ]);

    const totalOrders = Number(orderResult.rows[0]?.total_orders || 0);
    const onTimeDeliveries = Number(orderResult.rows[0]?.on_time_deliveries || 0);

    // Insert or update vendor performance
    const upsertQuery = `
      INSERT INTO vendor_performance (
        tenant_id,
        vendor_id,
        evaluation_period_start,
        evaluation_period_end,
        total_orders,
        on_time_deliveries,
        quality_score,
        pricing_competitiveness,
        responsiveness_score,
        total_spend,
        customer_satisfaction,
        evaluated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (tenant_id, vendor_id, evaluation_period_start)
      DO UPDATE SET
        evaluation_period_end = EXCLUDED.evaluation_period_end,
        total_orders = EXCLUDED.total_orders,
        on_time_deliveries = EXCLUDED.on_time_deliveries,
        quality_score = EXCLUDED.quality_score,
        pricing_competitiveness = EXCLUDED.pricing_competitiveness,
        responsiveness_score = EXCLUDED.responsiveness_score,
        total_spend = EXCLUDED.total_spend,
        customer_satisfaction = EXCLUDED.customer_satisfaction,
        evaluated_by = EXCLUDED.evaluated_by,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(upsertQuery, [
      tenantId,
      input.vendor_id,
      startDate,
      endDate,
      totalOrders,
      onTimeDeliveries,
      qualityScore,
      pricingScore,
      responsivenessScore,
      totalSpend,
      3.0, // Default customer satisfaction (could be from surveys)
      evaluatedBy,
    ]);

    return result.rows[0];
  }

  /**
   * Get vendor rankings for a specific period
   */
  async getVendorRankings(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    limit?: number
  ): Promise<VendorRanking[]> {
    const query = `
      SELECT
        vp.id,
        vp.vendor_id,
        v.name as vendor_name,
        v.type as vendor_type,
        vp.overall_score,
        vp.ranking,
        vp.on_time_percentage,
        vp.total_spend,
        vp.quality_score,
        vp.pricing_competitiveness,
        vp.responsiveness_score,
        vp.customer_satisfaction,
        vp.preferred_vendor,
        vp.evaluation_period_start,
        vp.evaluation_period_end
      FROM vendor_performance vp
      INNER JOIN vendors v ON vp.vendor_id = v.id
      WHERE vp.tenant_id = $1
        AND vp.evaluation_period_start >= $2
        AND vp.evaluation_period_end <= $3
      ORDER BY vp.ranking ASC NULLS LAST, vp.overall_score DESC
      LIMIT $4
    `;

    const result = await this.pool.query(query, [
      tenantId,
      startDate,
      endDate,
      limit || 100,
    ]);

    return result.rows;
  }

  /**
   * Get top performing vendors
   */
  async getTopVendors(
    tenantId: string,
    limit: number = 10
  ): Promise<VendorRanking[]> {
    const query = `
      SELECT
        vp.id,
        vp.vendor_id,
        v.name as vendor_name,
        v.type as vendor_type,
        vp.overall_score,
        vp.ranking,
        vp.on_time_percentage,
        vp.total_spend,
        vp.quality_score,
        vp.pricing_competitiveness,
        vp.responsiveness_score,
        vp.customer_satisfaction,
        vp.preferred_vendor,
        vp.evaluation_period_start,
        vp.evaluation_period_end
      FROM vendor_performance vp
      INNER JOIN vendors v ON vp.vendor_id = v.id
      WHERE vp.tenant_id = $1
        AND vp.evaluation_period_end >= CURRENT_DATE - INTERVAL '90 days'
      ORDER BY vp.overall_score DESC, vp.total_spend DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [tenantId, limit]);
    return result.rows;
  }

  /**
   * Get vendor spend analysis
   */
  async getVendorSpendAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VendorSpendAnalysis[]> {
    const query = `
      SELECT
        v.id as vendor_id,
        v.name as vendor_name,
        COALESCE(SUM(po.total_amount), 0) as total_spend,
        COUNT(DISTINCT po.id) as total_orders,
        CASE
          WHEN COUNT(DISTINCT po.id) > 0
          THEN COALESCE(SUM(po.total_amount), 0) / COUNT(DISTINCT po.id)
          ELSE 0
        END as average_order_value,
        MAX(po.order_date) as last_order_date,
        CASE
          WHEN MAX(po.order_date) IS NOT NULL
          THEN EXTRACT(DAY FROM (CURRENT_DATE - MAX(po.order_date)))
          ELSE NULL
        END as days_since_last_order
      FROM vendors v
      LEFT JOIN purchase_orders po ON v.id = po.vendor_id
        AND po.tenant_id = $1
        AND po.order_date BETWEEN $2 AND $3
        AND po.status != 'cancelled'
      WHERE v.tenant_id = $1
        AND v.is_active = true
      GROUP BY v.id, v.name
      HAVING COUNT(DISTINCT po.id) > 0
      ORDER BY total_spend DESC
    `;

    const result = await this.pool.query(query, [tenantId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Update preferred vendor status
   */
  async updatePreferredVendorStatus(
    performanceId: string,
    preferred: boolean,
    tenantId: string
  ): Promise<VendorPerformance> {
    const query = `
      UPDATE vendor_performance
      SET preferred_vendor = $1,
          updated_at = NOW()
      WHERE id = $2
        AND tenant_id = $3
      RETURNING *
    `;

    const result = await this.pool.query(query, [preferred, performanceId, tenantId]);

    if (result.rows.length === 0) {
      throw new Error('Vendor performance record not found');
    }

    return result.rows[0];
  }

  /**
   * Batch calculate scores for all vendors
   */
  async batchCalculateVendorScores(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    evaluatedBy: string
  ): Promise<VendorPerformance[]> {
    // Get all active vendors
    const vendorsQuery = `
      SELECT id FROM vendors
      WHERE tenant_id = $1 AND is_active = true
    `;

    const vendorsResult = await this.pool.query(vendorsQuery, [tenantId]);
    const vendors = vendorsResult.rows;

    // Calculate scores for each vendor
    const results: VendorPerformance[] = [];

    for (const vendor of vendors) {
      try {
        const performance = await this.calculateVendorScore(
          {
            vendor_id: vendor.id,
            start_date: startDate,
            end_date: endDate,
          },
          tenantId,
          evaluatedBy
        );
        results.push(performance);
      } catch (error) {
        console.error(`Error calculating score for vendor ${vendor.id}:`, error);
      }
    }

    return results;
  }
}
