import { Pool } from 'pg';
import { z } from 'zod';

import { AssetUtilizationInput, AssetUtilizationResult, HeatmapData, IdleAlert } from '../interfaces/utilization.interface';
import { cache } from '../utils/cache';

const assetUtilizationInputSchema = z.object({
  assetId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

/**
 * Service for calculating asset utilization metrics.
 */
export class UtilizationCalcService {
  constructor(private db: Pool) {}
  /**
   * Calculates the daily utilization percentage of an asset.
   * @param input The input parameters including assetId, startDate, and endDate.
   * @returns The utilization percentage.
   */
  async calculateDailyUtilization(input: AssetUtilizationInput): Promise<AssetUtilizationResult> {
    const { assetId, startDate, endDate } = assetUtilizationInputSchema.parse(input);
    const cacheKey = `utilization-${assetId}-${startDate}-${endDate}`;
    const cachedResult = await cache.get<AssetUtilizationResult>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const query = `
        SELECT asset_id, 
               AVG(active_hours::float / 24) * 100 AS utilization_percentage
        FROM asset_usage
        WHERE asset_id = $1 AND usage_date BETWEEN $2 AND $3
        GROUP BY asset_id;
      `;
      const values = [assetId, startDate, endDate];
      const client = await this.db.connect();
      const result = await client.query(query, values);
      client.release();

      if (result.rows.length === 0) {
        throw new Error('No data found for the specified asset and date range.');
      }

      const utilizationResult: AssetUtilizationResult = result.rows[0];
      await cache.set(cacheKey, utilizationResult, 300); // Cache for 5 minutes
      return utilizationResult;
    } catch (error) {
      console.error('Error calculating daily utilization:', error);
      throw new Error('Failed to calculate daily utilization.');
    }
  }

  /**
   * Generates alerts for assets that have been idle for more than 7 days.
   * @returns An array of idle alerts.
   */
  async generateIdleAlerts(): Promise<IdleAlert[]> {
    try {
      const query = `
        SELECT asset_id, MAX(usage_date) AS last_active_date
        FROM asset_usage
        GROUP BY asset_id
        HAVING MAX(usage_date) < CURRENT_DATE - INTERVAL '7 days';
      `;
      const client = await this.db.connect();
      const result = await client.query(query);
      client.release();

      return result.rows.map(row => ({
        assetId: row.asset_id,
        lastActiveDate: row.last_active_date,
      }));
    } catch (error) {
      console.error('Error generating idle alerts:', error);
      throw new Error('Failed to generate idle alerts.');
    }
  }

  /**
   * Calculates hourly usage patterns for an asset as heatmap data.
   * @param assetId The ID of the asset.
   * @returns Heatmap data for the asset.
   */
  async calculateHeatmapData(assetId: string): Promise<HeatmapData[]> {
    try {
      const query = `
        SELECT EXTRACT(hour FROM usage_start_time) AS hour, COUNT(*) AS usage_count
        FROM asset_usage
        WHERE asset_id = $1
        GROUP BY EXTRACT(hour FROM usage_start_time)
        ORDER BY hour;
      `;
      const values = [assetId];
      const client = await this.db.connect();
      const result = await client.query(query, values);
      client.release();

      return result.rows.map(row => ({
        hour: row.hour,
        usageCount: row.usage_count,
      }));
    } catch (error) {
      console.error('Error calculating heatmap data:', error);
      throw new Error('Failed to calculate heatmap data.');
    }
  }
}