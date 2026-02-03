/**
 * Warranty Eligibility Service
 *
 * Auto-check warranty coverage when work order created, verify component coverage,
 * check warranty expiration, and validate mileage/date limits
 *
 * @module services/warranty-eligibility
 * @author Claude Code - Agent 7 (Phase 3)
 * @date 2026-02-02
 */

import { Pool, PoolClient } from 'pg';
import {
    WarrantyEligibilityRequest,
    WarrantyEligibilityResult,
    WarrantyEligibilityResponse,
    Warranty,
    WarrantyStatus
} from '../types/warranties';

export class WarrantyEligibilityService {
    constructor(private db: Pool) {}

    /**
     * Check warranty eligibility for a work order or repair
     */
    async checkEligibility(
        tenantId: string,
        request: WarrantyEligibilityRequest
    ): Promise<WarrantyEligibilityResponse> {
        const { vehicle_id, component, failure_date, odometer } = request;

        const result = await this.db.query<WarrantyEligibilityResult>(
            `SELECT * FROM check_warranty_eligibility($1, $2, $3, $4)`,
            [vehicle_id, component, failure_date, odometer]
        );

        const allWarranties = result.rows;
        const eligible = allWarranties.filter(w => w.is_eligible);
        const ineligible = allWarranties.filter(w => !w.is_eligible);

        return {
            eligible_warranties: eligible,
            ineligible_warranties: ineligible,
            has_eligible_warranty: eligible.length > 0
        };
    }

    /**
     * Check if a specific component is covered by any active warranty
     */
    async isComponentCovered(
        tenantId: string,
        vehicleId: string,
        component: string,
        asOfDate: Date = new Date()
    ): Promise<boolean> {
        const result = await this.db.query<{ is_covered: boolean }>(
            `SELECT EXISTS (
                SELECT 1 FROM warranties
                WHERE tenant_id = $1
                  AND vehicle_id = $2
                  AND status = 'active'
                  AND (component = $3 OR component IS NULL) -- NULL means all components
                  AND start_date <= $4
                  AND (end_date IS NULL OR end_date >= $4)
            ) as is_covered`,
            [tenantId, vehicleId, component, asOfDate]
        );

        return result.rows[0]?.is_covered || false;
    }

    /**
     * Get all active warranties for a vehicle
     */
    async getActiveWarrantiesForVehicle(
        tenantId: string,
        vehicleId: string
    ): Promise<Warranty[]> {
        const result = await this.db.query<Warranty>(
            `SELECT * FROM warranties
             WHERE tenant_id = $1
               AND vehicle_id = $2
               AND status = 'active'
             ORDER BY end_date DESC NULLS LAST`,
            [tenantId, vehicleId]
        );

        return result.rows;
    }

    /**
     * Auto-check warranty when work order is created
     * This should be called from the work order creation flow
     */
    async autoCheckWorkOrderEligibility(
        tenantId: string,
        workOrderId: string,
        vehicleId: string,
        failedComponent: string | null,
        vehicleOdometer: number,
        failureDate: Date = new Date()
    ): Promise<{
        eligible: boolean;
        warranty_id?: string;
        warranty_info?: WarrantyEligibilityResult;
    }> {
        // Check eligibility
        const eligibility = await this.checkEligibility(tenantId, {
            vehicle_id: vehicleId,
            component: failedComponent || undefined,
            failure_date: failureDate,
            odometer: vehicleOdometer
        });

        if (!eligibility.has_eligible_warranty) {
            return { eligible: false };
        }

        // Get the best matching warranty (prioritize specific component matches)
        const bestWarranty = eligibility.eligible_warranties[0];

        // Update work order with warranty eligibility
        await this.db.query(
            `UPDATE work_orders
             SET warranty_claim_eligible = true,
                 warranty_id = $1
             WHERE id = $2 AND tenant_id = $3`,
            [bestWarranty.warranty_id, workOrderId, tenantId]
        );

        return {
            eligible: true,
            warranty_id: bestWarranty.warranty_id,
            warranty_info: bestWarranty
        };
    }

    /**
     * Verify warranty hasn't expired by date
     */
    async isWarrantyExpiredByDate(
        warrantyId: string,
        checkDate: Date = new Date()
    ): Promise<boolean> {
        const result = await this.db.query<{ is_expired: boolean }>(
            `SELECT
                CASE
                    WHEN end_date IS NULL THEN false
                    WHEN end_date < $2 THEN true
                    ELSE false
                END as is_expired
             FROM warranties
             WHERE id = $1`,
            [warrantyId, checkDate]
        );

        return result.rows[0]?.is_expired || false;
    }

    /**
     * Verify warranty hasn't expired by mileage
     */
    async isWarrantyExpiredByMileage(
        warrantyId: string,
        currentMileage: number
    ): Promise<boolean> {
        const result = await this.db.query<{ is_expired: boolean }>(
            `SELECT
                CASE
                    WHEN end_mileage IS NULL THEN false
                    WHEN end_mileage < $2 THEN true
                    ELSE false
                END as is_expired
             FROM warranties
             WHERE id = $1`,
            [warrantyId, currentMileage]
        );

        return result.rows[0]?.is_expired || false;
    }

    /**
     * Validate mileage/date limits for warranty claim
     */
    async validateLimits(
        warrantyId: string,
        failureDate: Date,
        vehicleOdometer: number
    ): Promise<{
        valid: boolean;
        reasons: string[];
    }> {
        const warranty = await this.db.query<Warranty>(
            `SELECT * FROM warranties WHERE id = $1`,
            [warrantyId]
        );

        if (warranty.rows.length === 0) {
            return {
                valid: false,
                reasons: ['Warranty not found']
            };
        }

        const w = warranty.rows[0];
        const reasons: string[] = [];

        // Check status
        if (w.status !== WarrantyStatus.ACTIVE) {
            reasons.push(`Warranty status is ${w.status}, not active`);
        }

        // Check date range
        if (w.start_date && new Date(failureDate) < new Date(w.start_date)) {
            reasons.push(`Failure date (${failureDate.toISOString().split('T')[0]}) is before warranty start date (${w.start_date})`);
        }

        if (w.end_date && new Date(failureDate) > new Date(w.end_date)) {
            reasons.push(`Failure date (${failureDate.toISOString().split('T')[0]}) is after warranty end date (${w.end_date})`);
        }

        // Check mileage limit
        if (w.end_mileage && vehicleOdometer > w.end_mileage) {
            reasons.push(`Vehicle odometer (${vehicleOdometer}) exceeds warranty mileage limit (${w.end_mileage})`);
        }

        return {
            valid: reasons.length === 0,
            reasons
        };
    }

    /**
     * Get warranties expiring soon (for proactive notifications)
     */
    async getExpiringWarranties(
        tenantId: string,
        daysThreshold: number = 30
    ): Promise<Array<Warranty & { days_until_expiration: number }>> {
        const result = await this.db.query(
            `SELECT
                w.*,
                (w.end_date - CURRENT_DATE) as days_until_expiration
             FROM warranties w
             WHERE w.tenant_id = $1
               AND w.status = 'active'
               AND w.end_date IS NOT NULL
               AND w.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2
             ORDER BY w.end_date ASC`,
            [tenantId, daysThreshold]
        );

        return result.rows;
    }

    /**
     * Expire warranties that have passed their end date
     * Should be run periodically (e.g., daily cron job)
     */
    async expireWarranties(): Promise<number> {
        const result = await this.db.query<{ expire_warranties: number }>(
            `SELECT expire_warranties() as expire_warranties`
        );

        return result.rows[0]?.expire_warranties || 0;
    }

    /**
     * Check if vehicle has manufacturer warranty coverage
     */
    async hasManufacturerWarranty(
        tenantId: string,
        vehicleId: string
    ): Promise<boolean> {
        const result = await this.db.query<{ has_warranty: boolean }>(
            `SELECT EXISTS (
                SELECT 1 FROM warranties
                WHERE tenant_id = $1
                  AND vehicle_id = $2
                  AND warranty_type = 'manufacturer'
                  AND status = 'active'
            ) as has_warranty`,
            [tenantId, vehicleId]
        );

        return result.rows[0]?.has_warranty || false;
    }

    /**
     * Get warranty coverage summary for a vehicle
     */
    async getVehicleWarrantyCoverage(
        tenantId: string,
        vehicleId: string
    ): Promise<{
        total_warranties: number;
        active_warranties: number;
        coverage_by_type: Record<string, number>;
        covered_components: string[];
        expiring_soon: number;
    }> {
        const warranties = await this.db.query<Warranty>(
            `SELECT * FROM warranties
             WHERE tenant_id = $1 AND vehicle_id = $2`,
            [tenantId, vehicleId]
        );

        const active = warranties.rows.filter(w => w.status === WarrantyStatus.ACTIVE);
        const expiringSoon = active.filter(w => {
            if (!w.end_date) return false;
            const daysUntil = Math.floor(
                (new Date(w.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysUntil <= 30;
        });

        const coverageByType: Record<string, number> = {};
        active.forEach(w => {
            coverageByType[w.warranty_type] = (coverageByType[w.warranty_type] || 0) + 1;
        });

        const coveredComponents = active
            .filter(w => w.component)
            .map(w => w.component!)
            .filter((v, i, a) => a.indexOf(v) === i); // unique

        return {
            total_warranties: warranties.rows.length,
            active_warranties: active.length,
            coverage_by_type: coverageByType,
            covered_components: coveredComponents,
            expiring_soon: expiringSoon.length
        };
    }

    /**
     * Recommend warranty coverage for a vehicle based on age and usage
     */
    async recommendWarrantyCoverage(
        tenantId: string,
        vehicleId: string
    ): Promise<{
        recommendations: Array<{
            component: string;
            reason: string;
            priority: 'high' | 'medium' | 'low';
        }>;
    }> {
        // Get vehicle info
        const vehicle = await this.db.query(
            `SELECT year, odometer, make, model
             FROM vehicles
             WHERE id = $1 AND tenant_id = $2`,
            [vehicleId, tenantId]
        );

        if (vehicle.rows.length === 0) {
            return { recommendations: [] };
        }

        const v = vehicle.rows[0];
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - (v.year || currentYear);
        const odometer = v.odometer || 0;

        const recommendations: Array<{
            component: string;
            reason: string;
            priority: 'high' | 'medium' | 'low';
        }> = [];

        // Check if vehicle is out of manufacturer warranty
        const hasManufacturer = await this.hasManufacturerWarranty(tenantId, vehicleId);

        if (!hasManufacturer && vehicleAge >= 3) {
            recommendations.push({
                component: 'powertrain',
                reason: 'Vehicle is out of manufacturer warranty',
                priority: 'high'
            });
        }

        // High mileage vehicles
        if (odometer > 75000) {
            recommendations.push({
                component: 'transmission',
                reason: 'High mileage vehicle (>75k miles)',
                priority: 'high'
            });
        }

        if (odometer > 100000) {
            recommendations.push({
                component: 'engine',
                reason: 'Very high mileage vehicle (>100k miles)',
                priority: 'high'
            });
        }

        return { recommendations };
    }
}

export default WarrantyEligibilityService;
