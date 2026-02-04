/**
 * Insurance & Claims Management Routes
 * Provides comprehensive insurance policy and claims tracking API
 */

import express, { Response } from 'express';

import logger from '../config/logger';
import { pool } from '../db/connection';
import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import {
  InsurancePolicy,
  InsuranceClaim,
  VehicleInsuranceAssignment,
  DriverInsuranceAssignment,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  FileClaimRequest,
  UpdateClaimStatusRequest,
  CoverageVerificationRequest,
  CoverageVerificationResponse,
  PolicyExpirationAlert,
} from '../types/insurance';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';

const router = express.Router();
router.use(authenticateJWT);

// ============================================================================
// INSURANCE POLICIES ROUTES
// ============================================================================

/**
 * GET /api/insurance/policies
 * List all insurance policies with optional filtering
 */
router.get(
  '/policies',
  requirePermission('insurance:view'),
  auditLog({ action: 'READ', resourceType: 'insurance_policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, policy_type, carrier, expiring_days } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = `
        SELECT ip.*,
               (SELECT COUNT(*) FROM vehicle_insurance_assignments
                WHERE policy_id = ip.id AND is_active = true) as active_vehicle_count,
               (SELECT COUNT(*) FROM driver_insurance_assignments
                WHERE policy_id = ip.id AND is_active = true) as active_driver_count
        FROM insurance_policies ip
        WHERE ip.tenant_id = $1
      `;
      const params: any[] = [req.user!.tenant_id];
      let paramIndex = 2;

      if (status) {
        query += ` AND ip.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (policy_type) {
        query += ` AND ip.policy_type = $${paramIndex}`;
        params.push(policy_type);
        paramIndex++;
      }

      if (carrier) {
        query += ` AND ip.insurance_carrier ILIKE $${paramIndex}`;
        params.push(`%${carrier}%`);
        paramIndex++;
      }

      if (expiring_days) {
        query += ` AND ip.policy_end_date <= CURRENT_DATE + INTERVAL '${Number(expiring_days)} days'`;
        query += ` AND ip.policy_end_date >= CURRENT_DATE`;
        query += ` AND ip.status = 'active'`;
      }

      query += ` ORDER BY ip.policy_end_date ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM insurance_policies WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      );

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Get insurance policies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/insurance/policies
 * Create a new insurance policy
 */
router.post(
  '/policies',
  csrfProtection,
  requirePermission('insurance:create'),
  auditLog({ action: 'CREATE', resourceType: 'insurance_policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data: CreatePolicyRequest = req.body;

      // Validate dates
      if (new Date(data.policy_end_date) < new Date(data.policy_start_date)) {
        return res.status(400).json({ error: 'Policy end date must be after start date' });
      }

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      );

      const result = await pool.query(
        `INSERT INTO insurance_policies (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      );

      logger.info(`Insurance policy created: ${result.rows[0].policy_number}`);
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      logger.error('Create insurance policy error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Policy number already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/insurance/policies/:id
 * Get a specific insurance policy by ID
 */
router.get(
  '/policies/:id',
  requirePermission('insurance:view'),
  auditLog({ action: 'READ', resourceType: 'insurance_policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT ip.*,
                (SELECT json_agg(via.*) FROM vehicle_insurance_assignments via
                 WHERE via.policy_id = ip.id) as vehicle_assignments,
                (SELECT json_agg(dia.*) FROM driver_insurance_assignments dia
                 WHERE dia.policy_id = ip.id) as driver_assignments
         FROM insurance_policies ip
         WHERE ip.id = $1 AND ip.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Insurance policy not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Get insurance policy error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/insurance/policies/:id
 * Update an existing insurance policy
 */
router.put(
  '/policies/:id',
  csrfProtection,
  requirePermission('insurance:update'),
  auditLog({ action: 'UPDATE', resourceType: 'insurance_policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data: UpdatePolicyRequest = req.body;
      const { fields, values } = buildUpdateClause(data, 3);

      const result = await pool.query(
        `UPDATE insurance_policies SET ${fields}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Insurance policy not found' });
      }

      logger.info(`Insurance policy updated: ${result.rows[0].policy_number}`);
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Update insurance policy error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/insurance/policies/expiring
 * Get policies expiring within specified days (default 30)
 */
router.get(
  '/policies/expiring',
  requirePermission('insurance:view'),
  auditLog({ action: 'READ', resourceType: 'insurance_policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const days = Number(req.query.days) || 30;

      const result = await pool.query(
        `SELECT ip.*,
                EXTRACT(DAY FROM (ip.policy_end_date - CURRENT_DATE)) as days_until_expiry,
                (SELECT COUNT(*) FROM vehicle_insurance_assignments
                 WHERE policy_id = ip.id AND is_active = true) as covered_vehicle_count,
                (SELECT COUNT(*) FROM driver_insurance_assignments
                 WHERE policy_id = ip.id AND is_active = true) as covered_driver_count
         FROM insurance_policies ip
         WHERE ip.tenant_id = $1
           AND ip.status = 'active'
           AND ip.policy_end_date <= CURRENT_DATE + INTERVAL '${days} days'
           AND ip.policy_end_date >= CURRENT_DATE
         ORDER BY ip.policy_end_date ASC`,
        [req.user!.tenant_id]
      );

      res.json({ data: result.rows });
    } catch (error) {
      logger.error('Get expiring policies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================================
// INSURANCE CLAIMS ROUTES
// ============================================================================

/**
 * POST /api/insurance/claims
 * File a new insurance claim
 */
router.post(
  '/claims',
  csrfProtection,
  requirePermission('insurance:create'),
  auditLog({ action: 'CREATE', resourceType: 'insurance_claims' }),
  async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const data: FileClaimRequest = req.body;

      // Generate claim number if not provided
      let claim_number = data.claim_number;
      if (!claim_number) {
        const numberResult = await client.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_num
           FROM insurance_claims WHERE tenant_id = $1`,
          [req.user!.tenant_id]
        );
        claim_number = `CLM-${String(numberResult.rows[0].next_num).padStart(6, '0')}`;
      }

      // Verify incident exists
      const incidentCheck = await client.query(
        `SELECT id FROM incidents WHERE id = $1 AND tenant_id = $2`,
        [data.incident_id, req.user!.tenant_id]
      );

      if (incidentCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Verify policy exists and is active
      const policyCheck = await client.query(
        `SELECT id, status FROM insurance_policies WHERE id = $1 AND tenant_id = $2`,
        [data.policy_id, req.user!.tenant_id]
      );

      if (policyCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Insurance policy not found' });
      }

      // Create initial timeline entry
      const timeline = [
        {
          date: new Date().toISOString(),
          event: 'Claim Filed',
          description: 'Insurance claim filed',
          user_id: req.user!.id,
        },
      ];

      const { columnNames, placeholders, values } = buildInsertClause(
        { ...data, claim_number, timeline: JSON.stringify(timeline), documents: '[]' },
        ['tenant_id', 'filed_by'],
        1
      );

      const claimResult = await client.query(
        `INSERT INTO insurance_claims (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, req.user!.id, ...values]
      );

      // Update incident with claim information
      await client.query(
        `UPDATE incidents
         SET claim_filed = true,
             claim_id = $1,
             at_fault_party = $2,
             total_loss = $3,
             updated_at = NOW()
         WHERE id = $4 AND tenant_id = $5`,
        [
          claimResult.rows[0].id,
          data.at_fault_party,
          data.total_loss || false,
          data.incident_id,
          req.user!.tenant_id,
        ]
      );

      await client.query('COMMIT');

      logger.info(`Insurance claim filed: ${claim_number}`);
      res.status(201).json(claimResult.rows[0]);
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('File insurance claim error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Claim number already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/insurance/claims/:id
 * Get claim details by ID
 */
router.get(
  '/claims/:id',
  requirePermission('insurance:view'),
  auditLog({ action: 'READ', resourceType: 'insurance_claims' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT ic.*,
                ip.policy_number, ip.insurance_carrier,
                i.incident_number, i.incident_date, i.location as incident_location,
                v.unit_number as vehicle_unit,
                d.first_name || ' ' || d.last_name as driver_name,
                u.first_name || ' ' || u.last_name as filed_by_name
         FROM insurance_claims ic
         LEFT JOIN insurance_policies ip ON ic.policy_id = ip.id
         LEFT JOIN incidents i ON ic.incident_id = i.id
         LEFT JOIN vehicles v ON i.vehicle_id = v.id
         LEFT JOIN drivers d ON i.driver_id = d.id
         LEFT JOIN users u ON ic.filed_by = u.id
         WHERE ic.id = $1 AND ic.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Insurance claim not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Get insurance claim error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/insurance/claims/:id/status
 * Update claim status and workflow
 */
router.put(
  '/claims/:id/status',
  csrfProtection,
  requirePermission('insurance:update'),
  auditLog({ action: 'UPDATE', resourceType: 'insurance_claims' }),
  async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const data: UpdateClaimStatusRequest = req.body;

      // Get current claim
      const currentResult = await client.query(
        `SELECT * FROM insurance_claims WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      );

      if (currentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Insurance claim not found' });
      }

      const currentClaim = currentResult.rows[0];

      // Add timeline entry
      const timeline = currentClaim.timeline || [];
      timeline.push({
        date: new Date().toISOString(),
        event: `Status changed to ${data.status}`,
        description: data.notes || `Claim status updated to ${data.status}`,
        user_id: req.user!.id,
      });

      // Build update query
      const updateData = {
        status: data.status,
        status_updated_at: new Date().toISOString(),
        timeline: JSON.stringify(timeline),
        ...(data.denial_reason && { denial_reason: data.denial_reason }),
        ...(data.claim_amount_approved !== undefined && {
          claim_amount_approved: data.claim_amount_approved,
        }),
        ...(data.payout_amount !== undefined && { payout_amount: data.payout_amount }),
        ...(data.payout_date && { payout_date: data.payout_date }),
        ...(data.insurance_adjuster_name && {
          insurance_adjuster_name: data.insurance_adjuster_name,
        }),
        ...(data.insurance_adjuster_phone && {
          insurance_adjuster_phone: data.insurance_adjuster_phone,
        }),
        ...(data.insurance_adjuster_email && {
          insurance_adjuster_email: data.insurance_adjuster_email,
        }),
      };

      const { fields, values } = buildUpdateClause(updateData, 3);

      const result = await client.query(
        `UPDATE insurance_claims SET ${fields}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      );

      await client.query('COMMIT');

      logger.info(`Insurance claim status updated: ${currentClaim.claim_number} -> ${data.status}`);
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Update claim status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/insurance/claims
 * List claims with filtering
 */
router.get(
  '/claims',
  requirePermission('insurance:view'),
  auditLog({ action: 'READ', resourceType: 'insurance_claims' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        policy_id,
        date_from,
        date_to,
        min_amount,
        max_amount,
      } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = `
        SELECT ic.*,
               ip.policy_number, ip.insurance_carrier,
               i.incident_number,
               v.unit_number as vehicle_unit,
               d.first_name || ' ' || d.last_name as driver_name
        FROM insurance_claims ic
        LEFT JOIN insurance_policies ip ON ic.policy_id = ip.id
        LEFT JOIN incidents i ON ic.incident_id = i.id
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        LEFT JOIN drivers d ON i.driver_id = d.id
        WHERE ic.tenant_id = $1
      `;
      const params: any[] = [req.user!.tenant_id];
      let paramIndex = 2;

      if (status) {
        query += ` AND ic.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (policy_id) {
        query += ` AND ic.policy_id = $${paramIndex}`;
        params.push(policy_id);
        paramIndex++;
      }

      if (date_from) {
        query += ` AND ic.filed_date >= $${paramIndex}`;
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        query += ` AND ic.filed_date <= $${paramIndex}`;
        params.push(date_to);
        paramIndex++;
      }

      if (min_amount) {
        query += ` AND ic.claim_amount_requested >= $${paramIndex}`;
        params.push(min_amount);
        paramIndex++;
      }

      if (max_amount) {
        query += ` AND ic.claim_amount_requested <= $${paramIndex}`;
        params.push(max_amount);
        paramIndex++;
      }

      query += ` ORDER BY ic.filed_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM insurance_claims WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      );

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Get insurance claims error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================================
// COVERAGE VERIFICATION ROUTES
// ============================================================================

/**
 * GET /api/vehicles/:vehicleId/insurance
 * Get vehicle insurance coverage
 */
router.get(
  '/vehicles/:vehicleId/insurance',
  requirePermission('insurance:view'),
  auditLog({ action: 'READ', resourceType: 'vehicle_insurance_assignments' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT via.*, ip.*
         FROM vehicle_insurance_assignments via
         JOIN insurance_policies ip ON via.policy_id = ip.id
         WHERE via.vehicle_id = $1
           AND via.is_active = true
           AND ip.tenant_id = $2
           AND ip.status = 'active'
         ORDER BY ip.policy_end_date DESC`,
        [req.params.vehicleId, req.user!.tenant_id]
      );

      res.json({ data: result.rows });
    } catch (error) {
      logger.error('Get vehicle insurance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/drivers/:driverId/insurance
 * Get driver insurance coverage
 */
router.get(
  '/drivers/:driverId/insurance',
  requirePermission('insurance:view'),
  auditLog({ action: 'READ', resourceType: 'driver_insurance_assignments' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT dia.*, ip.*
         FROM driver_insurance_assignments dia
         JOIN insurance_policies ip ON dia.policy_id = ip.id
         WHERE dia.driver_id = $1
           AND dia.is_active = true
           AND ip.tenant_id = $2
           AND ip.status = 'active'
         ORDER BY ip.policy_end_date DESC`,
        [req.params.driverId, req.user!.tenant_id]
      );

      res.json({ data: result.rows });
    } catch (error) {
      logger.error('Get driver insurance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/insurance/verify-coverage
 * Verify coverage for vehicle/driver combination
 */
router.post(
  '/insurance/verify-coverage',
  requirePermission('insurance:view'),
  auditLog({ action: 'READ', resourceType: 'insurance_policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data: CoverageVerificationRequest = req.body;
      const checkDate = data.date || new Date().toISOString().split('T')[0];

      let policies: any[] = [];
      const gaps: string[] = [];
      const warnings: string[] = [];

      // Check vehicle coverage
      if (data.vehicle_id) {
        const vehicleResult = await pool.query(
          `SELECT DISTINCT ip.*
           FROM insurance_policies ip
           LEFT JOIN vehicle_insurance_assignments via ON ip.id = via.policy_id
           WHERE ip.tenant_id = $1
             AND ip.status = 'active'
             AND ip.policy_start_date <= $2
             AND ip.policy_end_date >= $2
             AND (
               via.vehicle_id = $3 AND via.is_active = true
               OR ip.covered_vehicles @> $4::jsonb
               OR ip.covered_vehicles = '"all"'::jsonb
             )`,
          [req.user!.tenant_id, checkDate, data.vehicle_id, JSON.stringify([data.vehicle_id])]
        );

        policies = [...policies, ...vehicleResult.rows];

        if (vehicleResult.rows.length === 0) {
          gaps.push('No active insurance coverage found for specified vehicle');
        }
      }

      // Check driver coverage
      if (data.driver_id) {
        const driverResult = await pool.query(
          `SELECT DISTINCT ip.*
           FROM insurance_policies ip
           LEFT JOIN driver_insurance_assignments dia ON ip.id = dia.policy_id
           WHERE ip.tenant_id = $1
             AND ip.status = 'active'
             AND ip.policy_start_date <= $2
             AND ip.policy_end_date >= $2
             AND (
               dia.driver_id = $3 AND dia.is_active = true
               OR ip.covered_drivers @> $4::jsonb
               OR ip.covered_drivers = '"all"'::jsonb
             )`,
          [req.user!.tenant_id, checkDate, data.driver_id, JSON.stringify([data.driver_id])]
        );

        const driverPolicies = driverResult.rows.filter(
          (p: any) => !policies.find((existing) => existing.id === p.id)
        );
        policies = [...policies, ...driverPolicies];

        if (driverResult.rows.length === 0) {
          gaps.push('No active insurance coverage found for specified driver');
        }
      }

      // Check policy type if specified
      if (data.policy_type && policies.length > 0) {
        const hasType = policies.some((p) => p.policy_type === data.policy_type);
        if (!hasType) {
          warnings.push(`No ${data.policy_type} coverage found`);
        }
      }

      // Check for expiring policies
      policies.forEach((policy) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(policy.policy_end_date).getTime() - new Date(checkDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 30) {
          warnings.push(
            `Policy ${policy.policy_number} expires in ${daysUntilExpiry} days`
          );
        }
      });

      const response: CoverageVerificationResponse = {
        is_covered: policies.length > 0 && gaps.length === 0,
        policies,
        gaps: gaps.length > 0 ? gaps : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      res.json(response);
    } catch (error) {
      logger.error('Verify coverage error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
