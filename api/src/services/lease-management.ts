/**
 * Lease Management Service
 *
 * Provides business logic for lease tracking, mileage monitoring,
 * payment tracking, and lease vs. purchase analysis.
 *
 * @module services/lease-management
 * @since 2026-02-02
 */

import logger from '../config/logger';
import { tenantSafeQuery } from '../utils/dbHelpers';
import {
  MileageOverageCalculation,
  LeaseAlert,
  LeasePaymentTracking,
  LeasePurchaseComparison,
  VehicleContract,
} from '../types/contracts';

export class LeaseManagementService {
  /**
   * Calculate mileage overage for a leased vehicle
   */
  static async calculateMileageOverage(
    tenantId: string,
    vehicleId: string,
    currentOdometer?: number
  ): Promise<MileageOverageCalculation> {
    const query = `SELECT * FROM calculate_mileage_overage($1, $2)`;
    const result = await tenantSafeQuery(query, [vehicleId, currentOdometer || null], tenantId);

    if (result.rows.length === 0) {
      throw new Error('Unable to calculate mileage overage');
    }

    return result.rows[0] as MileageOverageCalculation;
  }

  /**
   * Generate mileage alerts for a vehicle (80%, 90%, 100% thresholds)
   */
  static async generateMileageAlerts(
    tenantId: string,
    vehicleId: string
  ): Promise<LeaseAlert[]> {
    // Get vehicle and contract details
    const vehicleQuery = `
      SELECT
        v.id,
        v.vehicle_number,
        v.odometer,
        v.lease_mileage_allowance,
        v.contract_id,
        vc.contract_number,
        vc.excess_mileage_fee,
        vc.end_date
      FROM vehicles v
      LEFT JOIN vehicle_contracts vc ON v.contract_id = vc.id
      WHERE v.id = $1 AND v.tenant_id = $2 AND v.ownership_type = 'leased'
    `;

    const vehicleResult = await tenantSafeQuery(vehicleQuery, [vehicleId, tenantId], tenantId);

    if (vehicleResult.rows.length === 0) {
      throw new Error('Vehicle not found or is not leased');
    }

    const vehicle = vehicleResult.rows[0];

    if (!vehicle.contract_id) {
      return [];
    }

    // Calculate mileage overage
    const mileageAnalysis = await this.calculateMileageOverage(tenantId, vehicleId, vehicle.odometer);

    const alerts: LeaseAlert[] = [];
    const percentageUsed = mileageAnalysis.percentage_used;

    // Generate alerts based on percentage thresholds
    if (percentageUsed >= 100) {
      alerts.push({
        vehicle_id: vehicleId,
        vehicle_number: vehicle.vehicle_number,
        contract_id: vehicle.contract_id,
        contract_number: vehicle.contract_number,
        alert_type: 'mileage_100',
        alert_message: `Vehicle ${vehicle.vehicle_number} has exceeded lease mileage allowance by ${mileageAnalysis.mileage_overage} miles. Estimated overage charge: $${mileageAnalysis.estimated_overage_charge.toFixed(2)}`,
        current_percentage: percentageUsed,
        mileage_remaining: mileageAnalysis.mileage_remaining,
        days_until_expiry: null,
        severity: 'critical',
        created_at: new Date().toISOString(),
      });
    } else if (percentageUsed >= 90) {
      alerts.push({
        vehicle_id: vehicleId,
        vehicle_number: vehicle.vehicle_number,
        contract_id: vehicle.contract_id,
        contract_number: vehicle.contract_number,
        alert_type: 'mileage_90',
        alert_message: `Vehicle ${vehicle.vehicle_number} has used ${percentageUsed.toFixed(1)}% of lease mileage allowance. Only ${mileageAnalysis.mileage_remaining} miles remaining.`,
        current_percentage: percentageUsed,
        mileage_remaining: mileageAnalysis.mileage_remaining,
        days_until_expiry: null,
        severity: 'warning',
        created_at: new Date().toISOString(),
      });
    } else if (percentageUsed >= 80) {
      alerts.push({
        vehicle_id: vehicleId,
        vehicle_number: vehicle.vehicle_number,
        contract_id: vehicle.contract_id,
        contract_number: vehicle.contract_number,
        alert_type: 'mileage_80',
        alert_message: `Vehicle ${vehicle.vehicle_number} has used ${percentageUsed.toFixed(1)}% of lease mileage allowance. ${mileageAnalysis.mileage_remaining} miles remaining.`,
        current_percentage: percentageUsed,
        mileage_remaining: mileageAnalysis.mileage_remaining,
        days_until_expiry: null,
        severity: 'info',
        created_at: new Date().toISOString(),
      });
    }

    // Check for lease expiration alerts (60 days before end)
    if (vehicle.end_date) {
      const daysUntilExpiry = Math.floor(
        (new Date(vehicle.end_date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilExpiry >= 0 && daysUntilExpiry <= 60) {
        alerts.push({
          vehicle_id: vehicleId,
          vehicle_number: vehicle.vehicle_number,
          contract_id: vehicle.contract_id,
          contract_number: vehicle.contract_number,
          alert_type: 'lease_expiring',
          alert_message: `Lease for ${vehicle.vehicle_number} expires in ${daysUntilExpiry} days. Schedule lease-end inspection.`,
          current_percentage: null,
          mileage_remaining: null,
          days_until_expiry: daysUntilExpiry,
          severity: daysUntilExpiry <= 30 ? 'warning' : 'info',
          created_at: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }

  /**
   * Get all mileage alerts for all leased vehicles in a tenant
   */
  static async getAllMileageAlerts(tenantId: string): Promise<LeaseAlert[]> {
    // Get all leased vehicles
    const vehiclesQuery = `
      SELECT id
      FROM vehicles
      WHERE tenant_id = $1 AND ownership_type = 'leased' AND contract_id IS NOT NULL
    `;

    const vehiclesResult = await tenantSafeQuery(vehiclesQuery, [tenantId], tenantId);

    const allAlerts: LeaseAlert[] = [];

    for (const vehicle of vehiclesResult.rows) {
      try {
        const alerts = await this.generateMileageAlerts(tenantId, vehicle.id);
        allAlerts.push(...alerts);
      } catch (error) {
        logger.error(`Error generating alerts for vehicle ${vehicle.id}:`, { error: error instanceof Error ? error.message : String(error) });
        // Continue with other vehicles
      }
    }

    return allAlerts;
  }

  /**
   * Track lease payments vs. budget
   */
  static async trackLeasePayments(
    tenantId: string,
    contractId: string
  ): Promise<LeasePaymentTracking> {
    const query = `
      SELECT
        vc.id as contract_id,
        vc.contract_number,
        vc.vehicle_id,
        vc.monthly_payment,
        vc.term_months,
        vc.total_paid,
        vc.start_date,
        vc.end_date
      FROM vehicle_contracts vc
      WHERE vc.id = $1 AND vc.tenant_id = $2 AND vc.contract_type = 'lease'
    `;

    const result = await tenantSafeQuery(query, [contractId, tenantId], tenantId);

    if (result.rows.length === 0) {
      throw new Error('Lease contract not found');
    }

    const contract = result.rows[0];

    // Calculate expected payments
    const monthsElapsed = this.calculateMonthsElapsed(
      new Date(contract.start_date),
      new Date()
    );

    const paymentsExpected = Math.min(monthsElapsed, contract.term_months);
    const budgetedAmount = contract.monthly_payment * paymentsExpected;
    const variance = budgetedAmount - (contract.total_paid || 0);
    const variancePercentage = budgetedAmount > 0
      ? ((variance / budgetedAmount) * 100)
      : 0;

    return {
      contract_id: contractId,
      contract_number: contract.contract_number,
      vehicle_id: contract.vehicle_id,
      monthly_payment: contract.monthly_payment,
      payments_made: paymentsExpected,
      total_paid: contract.total_paid || 0,
      budgeted_amount: budgetedAmount,
      variance,
      variance_percentage: variancePercentage,
    };
  }

  /**
   * Calculate lease vs. purchase analysis
   */
  static async calculateLeasePurchaseAnalysis(
    tenantId: string,
    vehicleId: string
  ): Promise<LeasePurchaseComparison> {
    // Get vehicle and lease contract
    const query = `
      SELECT
        v.id,
        v.vehicle_number,
        v.purchase_price,
        vc.id as contract_id,
        vc.monthly_payment,
        vc.term_months,
        vc.buyout_amount,
        vc.total_paid,
        vc.down_payment
      FROM vehicles v
      LEFT JOIN vehicle_contracts vc ON v.contract_id = vc.id
      WHERE v.id = $1 AND v.tenant_id = $2 AND v.ownership_type = 'leased'
    `;

    const result = await tenantSafeQuery(query, [vehicleId, tenantId], tenantId);

    if (result.rows.length === 0) {
      throw new Error('Leased vehicle not found');
    }

    const data = result.rows[0];

    // Calculate total lease cost
    const totalLeaseCost = (data.monthly_payment * data.term_months) + (data.down_payment || 0);
    const buyoutAmount = data.buyout_amount || 0;
    const totalLeasePlusBuyout = totalLeaseCost + buyoutAmount;

    // Estimate purchase option (using vehicle's purchase price or market value)
    const estimatedPurchasePrice = data.purchase_price || (totalLeaseCost * 0.85); // Estimate
    const estimatedFinancingCost = estimatedPurchasePrice * 0.10; // Assume 10% financing cost
    const totalPurchaseCost = estimatedPurchasePrice + estimatedFinancingCost;

    // Calculate difference
    const costDifference = totalLeasePlusBuyout - totalPurchaseCost;

    // Generate recommendation
    let recommendation: 'lease' | 'purchase' | 'neutral';
    let analysisNotes: string;

    if (costDifference > 5000) {
      recommendation = 'purchase';
      analysisNotes = `Purchasing would save approximately $${Math.abs(costDifference).toFixed(2)} over leasing with buyout.`;
    } else if (costDifference < -5000) {
      recommendation = 'lease';
      analysisNotes = `Leasing with buyout option is approximately $${Math.abs(costDifference).toFixed(2)} cheaper than outright purchase.`;
    } else {
      recommendation = 'neutral';
      analysisNotes = `Lease and purchase options are nearly equal in cost (difference: $${Math.abs(costDifference).toFixed(2)}). Consider other factors like flexibility and maintenance.`;
    }

    return {
      vehicle_id: vehicleId,
      vehicle_number: data.vehicle_number,
      total_lease_cost: totalLeaseCost,
      buyout_amount: buyoutAmount,
      total_lease_plus_buyout: totalLeasePlusBuyout,
      estimated_purchase_price: estimatedPurchasePrice,
      estimated_financing_cost: estimatedFinancingCost,
      total_purchase_cost: totalPurchaseCost,
      cost_difference: costDifference,
      recommendation,
      analysis_notes: analysisNotes,
    };
  }

  /**
   * Send alerts to notification system
   * This method would integrate with the notification service
   */
  static async sendLeaseAlerts(
    tenantId: string,
    alerts: LeaseAlert[]
  ): Promise<void> {
    // TODO: Integrate with notification service
    // For now, just log the alerts
    for (const alert of alerts) {
      logger.info(`[LEASE ALERT] ${alert.severity.toUpperCase()}: ${alert.alert_message}`);

      // In production, this would:
      // 1. Insert into notifications table
      // 2. Send email to fleet managers
      // 3. Send push notification
      // 4. Log to audit trail

      // Example notification creation:
      /*
      await tenantSafeQuery(
        `INSERT INTO notifications (
          tenant_id, user_id, notification_type, severity, title, message,
          metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          tenantId,
          null, // Send to all fleet managers
          'lease_alert',
          alert.severity,
          `Lease Alert: ${alert.alert_type}`,
          alert.alert_message,
          JSON.stringify({ alert }),
        ],
        tenantId
      );
      */
    }
  }

  /**
   * Helper: Calculate months elapsed between two dates
   */
  private static calculateMonthsElapsed(startDate: Date, endDate: Date): number {
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthsDiff = endDate.getMonth() - startDate.getMonth();
    return (yearsDiff * 12) + monthsDiff;
  }

  /**
   * Get upcoming lease expirations (next 60 days)
   */
  static async getUpcomingExpirations(
    tenantId: string,
    daysAhead: number = 60
  ): Promise<VehicleContract[]> {
    const query = `
      SELECT
        vc.*,
        v.vehicle_number,
        v.make,
        v.model,
        v.year,
        v.odometer
      FROM vehicle_contracts vc
      LEFT JOIN vehicles v ON vc.vehicle_id = v.id
      WHERE vc.tenant_id = $1
        AND vc.status = 'active'
        AND vc.contract_type = 'lease'
        AND vc.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + $2::INTEGER)
      ORDER BY vc.end_date ASC
    `;

    const result = await tenantSafeQuery(query, [tenantId, daysAhead], tenantId);
    return result.rows;
  }

  /**
   * Calculate estimated lease-end charges
   */
  static async estimateLeaseEndCharges(
    tenantId: string,
    vehicleId: string
  ): Promise<{
    mileage_overage_charge: number;
    estimated_wear_charge: number;
    estimated_total: number;
  }> {
    const mileageAnalysis = await this.calculateMileageOverage(tenantId, vehicleId);

    // Get vehicle age and condition for wear estimate
    const vehicleQuery = `
      SELECT v.year, v.condition, vc.wear_and_tear_coverage
      FROM vehicles v
      LEFT JOIN vehicle_contracts vc ON v.contract_id = vc.id
      WHERE v.id = $1 AND v.tenant_id = $2
    `;

    const vehicleResult = await tenantSafeQuery(vehicleQuery, [vehicleId, tenantId], tenantId);

    if (vehicleResult.rows.length === 0) {
      throw new Error('Vehicle not found');
    }

    const vehicle = vehicleResult.rows[0];

    // Estimate wear charges based on vehicle age and condition
    let estimatedWearCharge = 0;

    if (!vehicle.wear_and_tear_coverage) {
      const vehicleAge = new Date().getFullYear() - parseInt(vehicle.year);

      // Simple heuristic: older vehicles and poor condition = higher charges
      if (vehicle.condition === 'poor') {
        estimatedWearCharge = 2000 + (vehicleAge * 200);
      } else if (vehicle.condition === 'fair') {
        estimatedWearCharge = 1000 + (vehicleAge * 100);
      } else if (vehicle.condition === 'good') {
        estimatedWearCharge = 500 + (vehicleAge * 50);
      } else {
        estimatedWearCharge = 200;
      }
    }

    return {
      mileage_overage_charge: mileageAnalysis.estimated_overage_charge,
      estimated_wear_charge: estimatedWearCharge,
      estimated_total: mileageAnalysis.estimated_overage_charge + estimatedWearCharge,
    };
  }
}

export default LeaseManagementService;
