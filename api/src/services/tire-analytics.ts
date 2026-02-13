/**
 * Tire Analytics Service
 * Provides cost analysis, wear patterns, and optimization recommendations
 */

import { db } from '../db';
import logger from '../config/logger';
import {
  TireAnalytics,
  VehicleTireStatus,
  TireAlert,
  TireCostAnalysis,
  TireStatus,
  TireInventory
} from '../types/tires';

export class TireAnalyticsService {
  /**
   * Calculate comprehensive analytics for a specific tire
   */
  async getTireAnalytics(tireId: string, tenantId: string): Promise<TireAnalytics> {
    // Get tire details
    const tireQuery = `
      SELECT * FROM tire_inventory
      WHERE id = $1 AND tenant_id = $2
    `;
    const tireResult = await db.query<TireInventory>(tireQuery, [tireId, tenantId]);

    if (tireResult.rows.length === 0) {
      throw new Error('Tire not found');
    }

    const tire = tireResult.rows[0];

    // Get all mounting history
    const historyQuery = `
      SELECT * FROM vehicle_tire_positions
      WHERE tire_id = $1 AND tenant_id = $2
      ORDER BY mounted_date ASC
    `;
    const historyResult = await db.query(historyQuery, [tireId, tenantId]);
    const mountingHistory = historyResult.rows;

    // Calculate total miles
    const totalMiles = mountingHistory.reduce((sum, mount) => {
      return sum + (mount.miles_on_tire || 0);
    }, 0);

    // Get inspection history
    const inspectionsQuery = `
      SELECT * FROM tire_inspections
      WHERE tire_positions @> $1::jsonb
        AND tenant_id = $2
      ORDER BY inspection_date DESC
    `;
    const inspectionsResult = await db.query(
      inspectionsQuery,
      [JSON.stringify([{ tire_id: tireId }]), tenantId]
    );
    const inspectionCount = inspectionsResult.rows.length;

    // Get latest inspection tread depth
    let lastTreadDepth: number | undefined;
    let lastInspectionDate: Date | undefined;
    if (inspectionsResult.rows.length > 0) {
      const latestInspection = inspectionsResult.rows[0];
      const tirePositions = latestInspection.tire_positions as Array<{ tire_id: string; tread_depth?: number }>;
      const tirePosition = tirePositions.find((p) => p.tire_id === tireId);
      if (tirePosition) {
        lastTreadDepth = tirePosition.tread_depth;
        lastInspectionDate = latestInspection.inspection_date;
      }
    }

    // Calculate tread wear rate (32nds per 1000 miles)
    const initialTreadDepth = 20; // Standard new tire depth
    const currentTreadDepth = lastTreadDepth || tire.tread_depth_32nds;
    const treadWorn = initialTreadDepth - currentTreadDepth;
    const averageTreadWearRate = totalMiles > 0 ? (treadWorn / totalMiles) * 1000 : 0;

    // Calculate expected remaining miles
    const minTreadDepth = 4; // Legal minimum is typically 2/32", but 4/32" is safer
    const remainingTread = currentTreadDepth - minTreadDepth;
    const expectedRemainingMiles =
      averageTreadWearRate > 0 ? (remainingTread / averageTreadWearRate) * 1000 : 0;

    // Calculate actual life percentage compared to expected
    const expectedLifeMiles = tire.expected_life_miles || 50000;
    const actualLifePercentage = (totalMiles / expectedLifeMiles) * 100;

    // Count defects
    const defectsQuery = `
      SELECT COUNT(*) as defect_count
      FROM tire_inspections
      WHERE defects @> $1::jsonb
        AND tenant_id = $2
    `;
    const defectsResult = await db.query(
      defectsQuery,
      [JSON.stringify([{ tire_id: tireId }]), tenantId]
    );
    const defectCount = parseInt(defectsResult.rows[0]?.defect_count || '0');

    // Get current vehicle and position
    const currentMountQuery = `
      SELECT vehicle_id, position FROM vehicle_tire_positions
      WHERE tire_id = $1 AND tenant_id = $2 AND is_current = true
      LIMIT 1
    `;
    const currentMountResult = await db.query(currentMountQuery, [tireId, tenantId]);
    const currentVehicleId = currentMountResult.rows[0]?.vehicle_id;
    const currentPosition = currentMountResult.rows[0]?.position;

    // Calculate cost per mile
    const costPerMile =
      tire.purchase_price && totalMiles > 0 ? tire.purchase_price / totalMiles : 0;

    return {
      tire_id: tireId,
      tire_number: tire.tire_number,
      total_miles: totalMiles,
      cost_per_mile: costPerMile,
      average_tread_wear_rate: averageTreadWearRate,
      expected_remaining_miles: expectedRemainingMiles,
      actual_life_percentage: actualLifePercentage,
      rotation_count: mountingHistory.filter((m) => m.removal_reason === 'rotation').length,
      inspection_count: inspectionCount,
      defect_count: defectCount,
      last_inspection_date: lastInspectionDate,
      last_tread_depth: lastTreadDepth,
      current_vehicle_id: currentVehicleId,
      current_position: currentPosition
    };
  }

  /**
   * Get comprehensive tire status for a vehicle
   */
  async getVehicleTireStatus(vehicleId: string, tenantId: string): Promise<VehicleTireStatus> {
    // Get vehicle details
    const vehicleQuery = `
      SELECT make, model, license_plate, odometer FROM vehicles
      WHERE id = $1 AND tenant_id = $2
    `;
    const vehicleResult = await db.query(vehicleQuery, [vehicleId, tenantId]);

    if (vehicleResult.rows.length === 0) {
      throw new Error('Vehicle not found');
    }

    const vehicle = vehicleResult.rows[0];
    const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`;

    // Get current tires
    const tiresQuery = `
      SELECT
        vtp.position,
        vtp.tire_id,
        vtp.mounted_odometer,
        ti.tire_number,
        ti.tread_depth_32nds,
        ti.manufacturer,
        ti.model
      FROM vehicle_tire_positions vtp
      JOIN tire_inventory ti ON ti.id = vtp.tire_id
      WHERE vtp.vehicle_id = $1
        AND vtp.tenant_id = $2
        AND vtp.is_current = true
      ORDER BY vtp.position
    `;
    const tiresResult = await db.query(tiresQuery, [vehicleId, tenantId]);

    const currentTires = tiresResult.rows.map((row) => {
      const currentOdometer = vehicle.odometer || 0;
      const milesOnPosition = currentOdometer - row.mounted_odometer;

      // Determine status based on tread depth
      let status: 'good' | 'fair' | 'needs_attention' | 'replace_soon';
      if (row.tread_depth_32nds >= 10) {
        status = 'good';
      } else if (row.tread_depth_32nds >= 6) {
        status = 'fair';
      } else if (row.tread_depth_32nds >= 4) {
        status = 'needs_attention';
      } else {
        status = 'replace_soon';
      }

      return {
        position: row.position,
        tire_id: row.tire_id,
        tire_number: row.tire_number,
        tread_depth_32nds: row.tread_depth_32nds,
        miles_on_position: milesOnPosition,
        status
      };
    });

    // Get rotation schedule
    const scheduleQuery = `
      SELECT next_rotation_odometer, last_rotation_odometer, interval_miles
      FROM tire_rotation_schedules
      WHERE (vehicle_id = $1 OR vehicle_type IN (
        SELECT type FROM vehicles WHERE id = $1
      ))
      AND tenant_id = $2
      AND is_active = true
      ORDER BY vehicle_id DESC NULLS LAST
      LIMIT 1
    `;
    const scheduleResult = await db.query(scheduleQuery, [vehicleId, tenantId]);
    const schedule = scheduleResult.rows[0];

    const nextRotationDue = schedule?.next_rotation_odometer || 0;
    const milesUntilRotation = nextRotationDue - (vehicle.odometer || 0);

    // Get last inspection
    const inspectionQuery = `
      SELECT inspection_date FROM tire_inspections
      WHERE vehicle_id = $1 AND tenant_id = $2
      ORDER BY inspection_date DESC
      LIMIT 1
    `;
    const inspectionResult = await db.query(inspectionQuery, [vehicleId, tenantId]);
    const lastInspectionDate = inspectionResult.rows[0]?.inspection_date;

    // Generate alerts
    const alerts = this.generateVehicleTireAlerts(currentTires, milesUntilRotation);

    return {
      vehicle_id: vehicleId,
      vehicle_name: vehicleName,
      current_tires: currentTires,
      next_rotation_due: nextRotationDue,
      miles_until_rotation: milesUntilRotation,
      last_inspection_date: lastInspectionDate,
      alerts
    };
  }

  /**
   * Generate alerts for vehicle tire status
   */
  private generateVehicleTireAlerts(
    tires: Array<{
      position: string;
      tread_depth_32nds: number;
      status: string;
    }>,
    milesUntilRotation: number
  ): TireAlert[] {
    const alerts: TireAlert[] = [];

    // Check for low tread
    const lowTreadTires = tires.filter((t) => t.tread_depth_32nds <= 4);
    if (lowTreadTires.length > 0) {
      alerts.push({
        type: 'low_tread',
        severity: 'critical',
        message: `${lowTreadTires.length} tire(s) have critically low tread depth`,
        affected_positions: lowTreadTires.map((t) => t.position),
        recommended_action: 'Replace tires immediately - tread depth at or below 4/32"'
      });
    }

    const warnTreadTires = tires.filter(
      (t) => t.tread_depth_32nds > 4 && t.tread_depth_32nds <= 6
    );
    if (warnTreadTires.length > 0) {
      alerts.push({
        type: 'low_tread',
        severity: 'warning',
        message: `${warnTreadTires.length} tire(s) have low tread depth`,
        affected_positions: warnTreadTires.map((t) => t.position),
        recommended_action: 'Schedule tire replacement within the next service interval'
      });
    }

    // Check for overdue rotation
    if (milesUntilRotation < 0) {
      alerts.push({
        type: 'overdue_rotation',
        severity: 'critical',
        message: `Tire rotation overdue by ${Math.abs(milesUntilRotation)} miles`,
        recommended_action: 'Schedule tire rotation immediately to prevent uneven wear'
      });
    } else if (milesUntilRotation < 500) {
      alerts.push({
        type: 'overdue_rotation',
        severity: 'warning',
        message: `Tire rotation due in ${milesUntilRotation} miles`,
        recommended_action: 'Schedule tire rotation at next service appointment'
      });
    }

    // Check for uneven wear
    if (tires.length >= 2) {
      const treadDepths = tires.map((t) => t.tread_depth_32nds);
      const maxTread = Math.max(...treadDepths);
      const minTread = Math.min(...treadDepths);
      const difference = maxTread - minTread;

      if (difference > 4) {
        alerts.push({
          type: 'uneven_wear',
          severity: 'warning',
          message: `Uneven tire wear detected - ${difference}/32" difference`,
          recommended_action:
            'Check alignment and tire pressure. Consider early rotation to balance wear.'
        });
      }
    }

    return alerts;
  }

  /**
   * Get comprehensive cost analysis for tire fleet
   */
  async getTireCostAnalysis(tenantId: string): Promise<TireCostAnalysis> {
    // Get all tires with their cost and mileage data
    const costQuery = `
      SELECT
        ti.id,
        ti.status,
        ti.purchase_price,
        ti.warranty_miles,
        ti.expected_life_miles,
        COALESCE(SUM(vtp.miles_on_tire), 0) as total_miles
      FROM tire_inventory ti
      LEFT JOIN vehicle_tire_positions vtp ON vtp.tire_id = ti.id
      WHERE ti.tenant_id = $1
      GROUP BY ti.id
    `;
    const costResult = await db.query(costQuery, [tenantId]);

    let totalTireCost = 0;
    let totalMilesDriven = 0;
    let tireCount = costResult.rows.length;
    const tiresByStatus: Record<TireStatus, number> = {
      [TireStatus.IN_STOCK]: 0,
      [TireStatus.MOUNTED]: 0,
      [TireStatus.RETREADED]: 0,
      [TireStatus.SCRAPPED]: 0
    };
    let prematureFailures = 0;
    let warrantyClaimsAvailable = 0;
    let potentialWarrantyValue = 0;

    for (const tire of costResult.rows) {
      // Sum costs
      if (tire.purchase_price) {
        totalTireCost += parseFloat(tire.purchase_price);
      }
      totalMilesDriven += tire.total_miles;

      // Count by status
      if (tire.status in tiresByStatus) {
        tiresByStatus[tire.status as TireStatus]++;
      }

      // Check for premature failures
      if (tire.status === 'scrapped' && tire.expected_life_miles) {
        const lifePercentage = (tire.total_miles / tire.expected_life_miles) * 100;
        if (lifePercentage < 80) {
          prematureFailures++;

          // Check if still under warranty
          if (tire.warranty_miles && tire.total_miles < tire.warranty_miles) {
            warrantyClaimsAvailable++;
            // Estimate warranty value (pro-rated based on remaining warranty miles)
            const remainingWarrantyPercent =
              (tire.warranty_miles - tire.total_miles) / tire.warranty_miles;
            potentialWarrantyValue += (tire.purchase_price || 0) * remainingWarrantyPercent;
          }
        }
      }
    }

    const averageCostPerMile = totalMilesDriven > 0 ? totalTireCost / totalMilesDriven : 0;

    // Generate optimization recommendations
    const recommendations: string[] = [];

    if (prematureFailures > tireCount * 0.15) {
      recommendations.push(
        `High premature failure rate (${prematureFailures}/${tireCount}). Review tire pressure monitoring and rotation schedules.`
      );
    }

    if (warrantyClaimsAvailable > 0) {
      recommendations.push(
        `${warrantyClaimsAvailable} warranty claims available - potential recovery of $${potentialWarrantyValue.toFixed(2)}`
      );
    }

    if (averageCostPerMile > 0.15) {
      recommendations.push(
        `Cost per mile ($${averageCostPerMile.toFixed(3)}) is above industry average. Consider bulk purchasing or different tire brands.`
      );
    }

    if (tiresByStatus[TireStatus.IN_STOCK] > tireCount * 0.3) {
      recommendations.push(
        `High inventory levels (${tiresByStatus[TireStatus.IN_STOCK]} tires in stock). Consider reducing standing inventory to free up capital.`
      );
    }

    recommendations.push(
      'Implement regular tire pressure monitoring to extend tire life by 10-15%.'
    );
    recommendations.push(
      'Consider retread programs for drive and trailer tires to reduce costs by 30-50%.'
    );

    return {
      total_tire_cost: totalTireCost,
      total_miles_driven: totalMilesDriven,
      average_cost_per_mile: averageCostPerMile,
      tire_count: tireCount,
      tires_by_status: tiresByStatus,
      premature_failures: prematureFailures,
      warranty_claims_available: warrantyClaimsAvailable,
      potential_warranty_value: potentialWarrantyValue,
      cost_optimization_recommendations: recommendations
    };
  }

  /**
   * Identify tires with premature wear patterns
   */
  async identifyPrematureWear(tenantId: string): Promise<
    Array<{
      tire_id: string;
      tire_number: string;
      total_miles: number;
      expected_life_miles: number;
      life_percentage: number;
      status: string;
      recommended_action: string;
    }>
  > {
    const query = `
      SELECT
        ti.id as tire_id,
        ti.tire_number,
        ti.status,
        ti.expected_life_miles,
        COALESCE(SUM(vtp.miles_on_tire), 0) as total_miles
      FROM tire_inventory ti
      LEFT JOIN vehicle_tire_positions vtp ON vtp.tire_id = ti.id
      WHERE ti.tenant_id = $1
        AND ti.expected_life_miles IS NOT NULL
      GROUP BY ti.id
      HAVING COALESCE(SUM(vtp.miles_on_tire), 0) > 0
    `;

    const result = await db.query(query, [tenantId]);
    const prematureWearTires = [];

    for (const row of result.rows) {
      const lifePercentage = (row.total_miles / row.expected_life_miles) * 100;

      // Flag tires that are worn out before reaching 80% of expected life
      if (lifePercentage < 80 && row.status === 'scrapped') {
        let recommendedAction = 'Investigate cause of premature wear';

        if (lifePercentage < 50) {
          recommendedAction = 'Critical: Review alignment, pressure, and load distribution';
        } else if (lifePercentage < 70) {
          recommendedAction = 'Review maintenance schedules and rotation intervals';
        }

        prematureWearTires.push({
          tire_id: row.tire_id,
          tire_number: row.tire_number,
          total_miles: row.total_miles,
          expected_life_miles: row.expected_life_miles,
          life_percentage: lifePercentage,
          status: row.status,
          recommended_action: recommendedAction
        });
      }
    }

    return prematureWearTires;
  }

  /**
   * Calculate optimal tire replacement intervals based on historical data
   */
  async calculateOptimalReplacementInterval(tenantId: string, tireType: string): Promise<number> {
    const query = `
      SELECT AVG(total_miles) as avg_miles
      FROM (
        SELECT
          ti.id,
          SUM(vtp.miles_on_tire) as total_miles
        FROM tire_inventory ti
        JOIN vehicle_tire_positions vtp ON vtp.tire_id = ti.id
        WHERE ti.tenant_id = $1
          AND ti.tire_type = $2
          AND ti.status = 'scrapped'
        GROUP BY ti.id
        HAVING SUM(vtp.miles_on_tire) > 10000
      ) as tire_lifespans
    `;

    const result = await db.query(query, [tenantId, tireType]);
    const avgMiles = result.rows[0]?.avg_miles;

    // Return average miles with 10% buffer for safety
    return avgMiles ? Math.floor(avgMiles * 0.9) : 50000;
  }
}

export const tireAnalyticsService = new TireAnalyticsService();
