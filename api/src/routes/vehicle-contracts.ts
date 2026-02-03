/**
 * Vehicle Contracts & Leasing API Routes
 *
 * Provides endpoints for managing vehicle leases, purchase contracts, rentals,
 * lease-end inspections, and contract tracking.
 *
 * @module routes/vehicle-contracts
 * @since 2026-02-02
 */

import express, { Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import { tenantSafeQuery } from '../utils/dbHelpers';
import { applyFieldMasking } from '../utils/fieldMasking';

import {
  CreateVehicleContractDTO,
  UpdateVehicleContractDTO,
  CreateLeaseEndInspectionDTO,
  UpdateLeaseEndInspectionDTO,
  VehicleContractListParams,
} from '../types/contracts';

const router = express.Router();

// Security middleware
router.use(helmet());
router.use(authenticateJWT);
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));

// CSRF protection on mutations
router.post('/', doubleCsrfProtection);
router.put('/:id', doubleCsrfProtection);
router.delete('/:id', doubleCsrfProtection);
router.post('/lease-end-inspections', doubleCsrfProtection);
router.put('/lease-end-inspections/:id', doubleCsrfProtection);

// ============================================================================
// Vehicle Contracts Routes
// ============================================================================

/**
 * GET /api/vehicle-contracts
 * List all vehicle contracts with pagination and filtering
 */
router.get(
  '/',
  requirePermission('vehicle:view:team'),
  applyFieldMasking('contract'),
  auditLog({ action: 'READ', resourceType: 'vehicle_contracts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        vehicle_id,
        vendor_id,
        contract_type,
        status,
        expiring_within_days,
        sort_by = 'end_date',
        sort_order = 'asc',
      } = req.query as Partial<VehicleContractListParams>;

      const offset = (Number(page) - 1) * Number(limit);

      // Build WHERE clause dynamically
      const whereClauses = ['vc.tenant_id = $1'];
      const queryParams: any[] = [req.user!.tenant_id!];
      let paramIndex = 2;

      if (vehicle_id) {
        whereClauses.push(`vc.vehicle_id = $${paramIndex}`);
        queryParams.push(vehicle_id);
        paramIndex++;
      }

      if (vendor_id) {
        whereClauses.push(`vc.vendor_id = $${paramIndex}`);
        queryParams.push(vendor_id);
        paramIndex++;
      }

      if (contract_type) {
        whereClauses.push(`vc.contract_type = $${paramIndex}`);
        queryParams.push(contract_type);
        paramIndex++;
      }

      if (status) {
        whereClauses.push(`vc.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (expiring_within_days) {
        whereClauses.push(`vc.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + $${paramIndex}::INTEGER)`);
        whereClauses.push(`vc.status = 'active'`);
        queryParams.push(expiring_within_days);
        paramIndex++;
      }

      const whereClause = whereClauses.join(' AND ');

      // Validate sort_by to prevent SQL injection
      const validSortColumns = ['end_date', 'contract_number', 'monthly_payment', 'created_at'];
      const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'end_date';
      const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';

      const query = `
        SELECT
          vc.*,
          v.vehicle_number,
          vn.name as vendor_name
        FROM vehicle_contracts vc
        LEFT JOIN vehicles v ON vc.vehicle_id = v.id
        LEFT JOIN vendors vn ON vc.vendor_id = vn.id
        WHERE ${whereClause}
        ORDER BY vc.${sortColumn} ${sortDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await tenantSafeQuery(query, queryParams, req.user!.tenant_id!);

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM vehicle_contracts vc WHERE ${whereClause}`;
      const countResult = await tenantSafeQuery(countQuery, queryParams.slice(0, -2), req.user!.tenant_id!);

      res.json({
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: Number(page),
          limit: Number(limit),
          total_pages: Math.ceil(countResult.rows[0].count / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get vehicle contracts error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/vehicle-contracts
 * Create a new vehicle contract
 */
router.post(
  '/',
  requirePermission('vehicle:edit:team'),
  applyFieldMasking('contract'),
  auditLog({ action: 'CREATE', resourceType: 'vehicle_contracts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const contractData: CreateVehicleContractDTO = req.body;

      // Validate required fields
      if (!contractData.contract_number || !contractData.contract_type || !contractData.vendor_id ||
          !contractData.start_date || !contractData.end_date) {
        return res.status(400).json({
          error: 'Missing required fields: contract_number, contract_type, vendor_id, start_date, end_date',
        });
      }

      // Calculate term_months if not provided
      const term_months = contractData.term_months ||
        Math.round((new Date(contractData.end_date).getTime() - new Date(contractData.start_date).getTime()) /
        (30 * 24 * 60 * 60 * 1000));

      const query = `
        INSERT INTO vehicle_contracts (
          tenant_id, contract_number, contract_type, vehicle_id, vendor_id,
          start_date, end_date, term_months, monthly_payment, down_payment,
          buyout_option, buyout_amount, mileage_allowance_annual, excess_mileage_fee,
          early_termination_fee, wear_and_tear_coverage, maintenance_included,
          insurance_included, contract_document_url, auto_renew, renewal_notice_days,
          notes, metadata, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24
        ) RETURNING *
      `;

      const values = [
        req.user!.tenant_id!,
        contractData.contract_number,
        contractData.contract_type,
        contractData.vehicle_id || null,
        contractData.vendor_id,
        contractData.start_date,
        contractData.end_date,
        term_months,
        contractData.monthly_payment || null,
        contractData.down_payment || null,
        contractData.buyout_option || false,
        contractData.buyout_amount || null,
        contractData.mileage_allowance_annual || null,
        contractData.excess_mileage_fee || null,
        contractData.early_termination_fee || null,
        contractData.wear_and_tear_coverage || false,
        contractData.maintenance_included || false,
        contractData.insurance_included || false,
        contractData.contract_document_url || null,
        contractData.auto_renew || false,
        contractData.renewal_notice_days || 60,
        contractData.notes || null,
        JSON.stringify(contractData.metadata || {}),
        req.user!.id!,
      ];

      const result = await tenantSafeQuery(query, values, req.user!.tenant_id!);

      // Update vehicle ownership fields if vehicle_id is provided
      if (contractData.vehicle_id && contractData.contract_type === 'lease') {
        const updateVehicleQuery = `
          UPDATE vehicles
          SET ownership_type = 'leased',
              contract_id = $1,
              lease_end_date = $2,
              lease_mileage_allowance = $3,
              updated_at = NOW()
          WHERE id = $4 AND tenant_id = $5
        `;
        await tenantSafeQuery(updateVehicleQuery, [
          result.rows[0].id,
          contractData.end_date,
          contractData.mileage_allowance_annual || null,
          contractData.vehicle_id,
          req.user!.tenant_id!,
        ], req.user!.tenant_id!);
      }

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create vehicle contract error:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Contract number already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicle-contracts/expiring
 * Get contracts expiring soon (within specified days)
 */
router.get(
  '/expiring',
  requirePermission('vehicle:view:team'),
  applyFieldMasking('contract'),
  auditLog({ action: 'READ', resourceType: 'vehicle_contracts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { days = 60 } = req.query;

      const query = `
        SELECT * FROM get_expiring_contracts($1, $2)
      `;

      const result = await tenantSafeQuery(query, [req.user!.tenant_id!, days], req.user!.tenant_id!);

      res.json({
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('Get expiring contracts error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicle-contracts/:id
 * Get a specific vehicle contract by ID
 */
router.get(
  '/:id',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('contract'),
  auditLog({ action: 'READ', resourceType: 'vehicle_contracts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const query = `
        SELECT
          vc.*,
          v.vehicle_number,
          v.vin,
          v.make,
          v.model,
          v.year,
          vn.name as vendor_name,
          vn.contact_name as vendor_contact_name,
          vn.contact_phone as vendor_contact_phone,
          vn.contact_email as vendor_contact_email
        FROM vehicle_contracts vc
        LEFT JOIN vehicles v ON vc.vehicle_id = v.id
        LEFT JOIN vendors vn ON vc.vendor_id = vn.id
        WHERE vc.id = $1 AND vc.tenant_id = $2
      `;

      const result = await tenantSafeQuery(query, [req.params.id, req.user!.tenant_id!], req.user!.tenant_id!);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get vehicle contract error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/vehicle-contracts/:id
 * Update a vehicle contract
 */
router.put(
  '/:id',
  requirePermission('vehicle:edit:team'),
  applyFieldMasking('contract'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicle_contracts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const contractData: UpdateVehicleContractDTO = req.body;
      const contractId = req.params.id;

      // Build UPDATE query dynamically based on provided fields
      const updateFields: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Define updatable fields
      const updatableFields: (keyof UpdateVehicleContractDTO)[] = [
        'contract_number', 'contract_type', 'vehicle_id', 'vendor_id',
        'start_date', 'end_date', 'term_months', 'monthly_payment', 'down_payment',
        'buyout_option', 'buyout_amount', 'mileage_allowance_annual', 'excess_mileage_fee',
        'early_termination_fee', 'wear_and_tear_coverage', 'maintenance_included',
        'insurance_included', 'contract_document_url', 'auto_renew', 'renewal_notice_days',
        'status', 'termination_date', 'termination_reason', 'total_paid',
        'final_buyout_exercised', 'notes', 'metadata',
      ];

      for (const field of updatableFields) {
        if (contractData[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          queryParams.push(contractData[field]);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updateFields.push(`updated_at = NOW()`);
      updateFields.push(`updated_by = $${paramIndex}`);
      queryParams.push(req.user!.id!);
      paramIndex++;

      queryParams.push(contractId, req.user!.tenant_id!);

      const query = `
        UPDATE vehicle_contracts
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex - 1} AND tenant_id = $${paramIndex}
        RETURNING *
      `;

      const result = await tenantSafeQuery(query, queryParams, req.user!.tenant_id!);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update vehicle contract error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Contract number already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicles/:vehicleId/lease-status
 * Get lease status and mileage overage alerts for a specific vehicle
 */
router.get(
  '/vehicles/:vehicleId/lease-status',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('contract'),
  auditLog({ action: 'READ', resourceType: 'vehicle_contracts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;

      // Get vehicle and contract information
      const vehicleQuery = `
        SELECT
          v.*,
          vc.*
        FROM vehicles v
        LEFT JOIN vehicle_contracts vc ON v.contract_id = vc.id
        WHERE v.id = $1 AND v.tenant_id = $2
      `;

      const vehicleResult = await tenantSafeQuery(vehicleQuery, [vehicleId, req.user!.tenant_id!], req.user!.tenant_id!);

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const vehicle = vehicleResult.rows[0];

      if (!vehicle.contract_id || vehicle.ownership_type !== 'leased') {
        return res.status(400).json({ error: 'Vehicle does not have an active lease' });
      }

      // Calculate mileage overage
      const mileageQuery = `SELECT * FROM calculate_mileage_overage($1, $2)`;
      const mileageResult = await tenantSafeQuery(mileageQuery, [vehicleId, vehicle.odometer], req.user!.tenant_id!);

      const mileageAnalysis = mileageResult.rows[0];

      // Generate alerts based on mileage usage
      const alerts: any[] = [];
      const percentageUsed = mileageAnalysis.percentage_used;

      if (percentageUsed >= 100) {
        alerts.push({
          vehicle_id: vehicleId,
          vehicle_number: vehicle.vehicle_number,
          contract_id: vehicle.contract_id,
          contract_number: vehicle.contract_number,
          alert_type: 'mileage_100',
          alert_message: `Vehicle has exceeded lease mileage allowance by ${mileageAnalysis.mileage_overage} miles. Estimated overage charge: $${mileageAnalysis.estimated_overage_charge}`,
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
          alert_message: `Vehicle has used ${percentageUsed.toFixed(1)}% of lease mileage allowance. Only ${mileageAnalysis.mileage_remaining} miles remaining.`,
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
          alert_message: `Vehicle has used ${percentageUsed.toFixed(1)}% of lease mileage allowance.`,
          current_percentage: percentageUsed,
          mileage_remaining: mileageAnalysis.mileage_remaining,
          days_until_expiry: null,
          severity: 'info',
          created_at: new Date().toISOString(),
        });
      }

      // Check for lease expiration alerts
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
          alert_message: `Lease expires in ${daysUntilExpiry} days. Schedule lease-end inspection.`,
          current_percentage: null,
          mileage_remaining: null,
          days_until_expiry: daysUntilExpiry,
          severity: daysUntilExpiry <= 30 ? 'warning' : 'info',
          created_at: new Date().toISOString(),
        });
      }

      // Check if inspection is scheduled
      const inspectionQuery = `
        SELECT id, inspection_date
        FROM lease_end_inspections
        WHERE contract_id = $1 AND tenant_id = $2
        ORDER BY inspection_date DESC
        LIMIT 1
      `;
      const inspectionResult = await tenantSafeQuery(inspectionQuery, [vehicle.contract_id, req.user!.tenant_id!], req.user!.tenant_id!);

      const recommendedInspectionDate = new Date(vehicle.end_date);
      recommendedInspectionDate.setDate(recommendedInspectionDate.getDate() - 60);

      res.json({
        vehicle_id: vehicleId,
        vehicle_number: vehicle.vehicle_number,
        contract: {
          id: vehicle.contract_id,
          contract_number: vehicle.contract_number,
          end_date: vehicle.end_date,
          mileage_allowance_annual: vehicle.mileage_allowance_annual,
          excess_mileage_fee: vehicle.excess_mileage_fee,
        },
        mileage_analysis: mileageAnalysis,
        alerts,
        upcoming_inspection: {
          recommended_date: recommendedInspectionDate.toISOString().split('T')[0],
          inspection_scheduled: inspectionResult.rows.length > 0,
          inspection_id: inspectionResult.rows[0]?.id || null,
        },
      });
    } catch (error) {
      console.error('Get lease status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================================
// Lease-End Inspection Routes
// ============================================================================

/**
 * POST /api/vehicle-contracts/lease-end-inspections
 * Create a new lease-end inspection
 */
router.post(
  '/lease-end-inspections',
  requirePermission('vehicle:edit:team'),
  applyFieldMasking('inspection'),
  auditLog({ action: 'CREATE', resourceType: 'lease_end_inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const inspectionData: CreateLeaseEndInspectionDTO = req.body;

      // Validate required fields
      if (!inspectionData.contract_id || !inspectionData.vehicle_id ||
          !inspectionData.inspection_date || inspectionData.final_odometer === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: contract_id, vehicle_id, inspection_date, final_odometer',
        });
      }

      // Calculate total charges
      const totalCharges = (inspectionData.mileage_penalty || 0) +
        (inspectionData.excess_wear_total || 0) +
        (inspectionData.missing_items_total || 0);

      const query = `
        INSERT INTO lease_end_inspections (
          tenant_id, contract_id, vehicle_id, inspection_date, inspector_name,
          inspector_company, final_odometer, mileage_overage, mileage_penalty,
          excess_wear_items, excess_wear_total, missing_items, missing_items_total,
          total_charges, disposition, disposition_date, final_invoice_url,
          notes, metadata, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING *
      `;

      const values = [
        req.user!.tenant_id!,
        inspectionData.contract_id,
        inspectionData.vehicle_id,
        inspectionData.inspection_date,
        inspectionData.inspector_name || null,
        inspectionData.inspector_company || null,
        inspectionData.final_odometer,
        inspectionData.mileage_overage || 0,
        inspectionData.mileage_penalty || 0,
        JSON.stringify(inspectionData.excess_wear_items || []),
        inspectionData.excess_wear_total || 0,
        JSON.stringify(inspectionData.missing_items || []),
        inspectionData.missing_items_total || 0,
        totalCharges,
        inspectionData.disposition || null,
        inspectionData.disposition_date || null,
        inspectionData.final_invoice_url || null,
        inspectionData.notes || null,
        JSON.stringify(inspectionData.metadata || {}),
        req.user!.id!,
      ];

      const result = await tenantSafeQuery(query, values, req.user!.tenant_id!);

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create lease-end inspection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicle-contracts/lease-end-inspections/:id
 * Get a specific lease-end inspection by ID
 */
router.get(
  '/lease-end-inspections/:id',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('inspection'),
  auditLog({ action: 'READ', resourceType: 'lease_end_inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const query = `
        SELECT
          lei.*,
          vc.contract_number,
          vc.vendor_id,
          v.vehicle_number,
          v.vin,
          v.make,
          v.model,
          v.year,
          vn.name as vendor_name
        FROM lease_end_inspections lei
        INNER JOIN vehicle_contracts vc ON lei.contract_id = vc.id
        INNER JOIN vehicles v ON lei.vehicle_id = v.id
        LEFT JOIN vendors vn ON vc.vendor_id = vn.id
        WHERE lei.id = $1 AND lei.tenant_id = $2
      `;

      const result = await tenantSafeQuery(query, [req.params.id, req.user!.tenant_id!], req.user!.tenant_id!);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lease-end inspection not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get lease-end inspection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
