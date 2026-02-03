/**
 * VENDOR PERFORMANCE & CONTRACT MANAGEMENT API ROUTES
 * Phase 3 - Agent 8: RESTful endpoints for vendor scorecards, contracts, and contacts
 * Security: JWT auth, tenant isolation, parameterized queries, CSRF protection
 */

import { Router, Response } from 'express';
import { pool } from '../config/database';
import { csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenant-context';
import { VendorScoringService } from '../services/vendor-scoring';
import { VendorContractService } from '../services/vendor-contracts';
import logger from '../config/logger';

const router = Router();

// Initialize services
const scoringService = new VendorScoringService(pool);
const contractService = new VendorContractService(pool);

// Apply authentication and tenant context to all routes
router.use(authenticateJWT);
router.use(setTenantContext);

// ============================================================================
// VENDOR PERFORMANCE ENDPOINTS
// ============================================================================

/**
 * GET /api/vendors/:id/performance
 * Get performance scorecards for a specific vendor
 */
router.get(
  '/:id/performance',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const vendorId = req.params.id;
    const { start_date, end_date, limit = '10' } = req.query;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const query = `
      SELECT
        vp.*,
        v.name as vendor_name,
        v.type as vendor_type,
        COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email) as evaluated_by_name
      FROM vendor_performance vp
      INNER JOIN vendors v ON vp.vendor_id = v.id
      LEFT JOIN users u ON vp.evaluated_by = u.id
      WHERE vp.vendor_id = $1
        AND vp.tenant_id = $2
        ${start_date ? 'AND vp.evaluation_period_start >= $3' : ''}
        ${end_date ? 'AND vp.evaluation_period_end <= $4' : ''}
      ORDER BY vp.evaluation_period_start DESC
      LIMIT $${start_date && end_date ? '5' : '3'}
    `;

    const params = [vendorId, tenantId];
    if (start_date) params.push(start_date as string);
    if (end_date) params.push(end_date as string);
    params.push(limit as string);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      total: result.rows.length,
    });
  })
);

/**
 * POST /api/vendors/:id/performance
 * Create or update performance evaluation for a vendor
 */
router.post(
  '/:id/performance',
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const vendorId = req.params.id;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { start_date, end_date, ...metrics } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'start_date and end_date are required',
      });
    }

    const performance = await scoringService.calculateVendorScore(
      {
        vendor_id: vendorId,
        start_date,
        end_date,
      },
      tenantId,
      userId
    );

    logger.info('Vendor performance calculated', {
      vendorId,
      tenantId,
      userId,
      overallScore: performance.overall_score,
    });

    res.status(201).json({ data: performance });
  })
);

/**
 * GET /api/vendor-performance/rankings
 * Get vendor rankings for current or specified period
 */
router.get(
  '/rankings',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const { start_date, end_date, limit = '20' } = req.query;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const startDate = start_date
      ? new Date(start_date as string)
      : new Date(new Date().setDate(new Date().getDate() - 90));
    const endDate = end_date ? new Date(end_date as string) : new Date();

    const rankings = await scoringService.getVendorRankings(
      startDate,
      endDate,
      tenantId,
      parseInt(limit as string)
    );

    res.json({
      data: rankings,
      total: rankings.length,
      evaluation_period_start: startDate,
      evaluation_period_end: endDate,
    });
  })
);

/**
 * GET /api/vendor-performance/top-vendors
 * Get top performing vendors (last 90 days)
 */
router.get(
  '/top-vendors',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const { limit = '10' } = req.query;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const topVendors = await scoringService.getTopVendors(
      tenantId,
      parseInt(limit as string)
    );

    res.json({
      data: topVendors,
      total: topVendors.length,
    });
  })
);

/**
 * POST /api/vendor-performance/batch-calculate
 * Batch calculate scores for all vendors
 */
router.post(
  '/batch-calculate',
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'start_date and end_date are required',
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    const results = await scoringService.batchCalculateVendorScores(
      startDate,
      endDate,
      tenantId,
      userId
    );

    logger.info('Batch vendor scoring completed', {
      tenantId,
      userId,
      count: results.length,
    });

    res.json({
      data: results,
      total: results.length,
      message: `Successfully calculated scores for ${results.length} vendors`,
    });
  })
);

// ============================================================================
// VENDOR CONTRACT ENDPOINTS
// ============================================================================

/**
 * POST /api/vendor-contracts
 * Create a new vendor contract
 */
router.post(
  '/contracts',
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contract = await contractService.createContract(
      req.body,
      tenantId,
      userId
    );

    logger.info('Vendor contract created', {
      contractId: contract.id,
      vendorId: contract.vendor_id,
      tenantId,
      userId,
    });

    res.status(201).json({ data: contract });
  })
);

/**
 * GET /api/vendor-contracts
 * List vendor contracts with filtering
 */
router.get(
  '/contracts',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const {
      vendor_id,
      contract_type,
      status = 'active',
      limit = '50',
      offset = '0',
    } = req.query;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let query = `
      SELECT
        vc.*,
        v.name as vendor_name,
        v.contact_name as vendor_contact_name,
        v.contact_email as vendor_contact_email,
        COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email) as created_by_name
      FROM vendor_contracts vc
      INNER JOIN vendors v ON vc.vendor_id = v.id
      LEFT JOIN users u ON vc.created_by = u.id
      WHERE vc.tenant_id = $1
    `;

    const params: unknown[] = [tenantId];
    let paramCount = 2;

    if (vendor_id) {
      query += ` AND vc.vendor_id = $${paramCount++}`;
      params.push(vendor_id);
    }

    if (contract_type) {
      query += ` AND vc.contract_type = $${paramCount++}`;
      params.push(contract_type);
    }

    if (status) {
      query += ` AND vc.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY vc.end_date DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vendor_contracts
      WHERE tenant_id = $1
      ${vendor_id ? 'AND vendor_id = $2' : ''}
      ${contract_type ? `AND contract_type = $${vendor_id ? '3' : '2'}` : ''}
      ${status ? `AND status = $${[vendor_id, contract_type].filter(Boolean).length + 2}` : ''}
    `;

    const countParams = [tenantId];
    if (vendor_id) countParams.push(vendor_id);
    if (contract_type) countParams.push(contract_type);
    if (status) countParams.push(status);

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
      pageSize: parseInt(limit as string),
    });
  })
);

/**
 * GET /api/vendor-contracts/expiring
 * Get contracts expiring within specified days
 */
router.get(
  '/contracts/expiring',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const { days = '90' } = req.query;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const expiringContracts = await contractService.getExpiringContracts(
      parseInt(days as string),
      tenantId
    );

    res.json({
      data: expiringContracts,
      total: expiringContracts.length,
      days_range: parseInt(days as string),
    });
  })
);

/**
 * PUT /api/vendor-contracts/:id
 * Update a vendor contract
 */
router.put(
  '/contracts/:id',
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const contractId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contract = await contractService.updateContract(
      contractId,
      req.body,
      tenantId
    );

    logger.info('Vendor contract updated', {
      contractId,
      tenantId,
    });

    res.json({ data: contract });
  })
);

/**
 * POST /api/vendor-contracts/:id/terminate
 * Terminate a vendor contract
 */
router.post(
  '/contracts/:id/terminate',
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const contractId = req.params.id;
    const { reason } = req.body;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Termination reason is required' });
    }

    const contract = await contractService.terminateContract(
      contractId,
      reason,
      userId,
      tenantId
    );

    logger.info('Vendor contract terminated', {
      contractId,
      tenantId,
      userId,
      reason,
    });

    res.json({ data: contract });
  })
);

/**
 * POST /api/vendor-contracts/:id/renew
 * Renew a vendor contract
 */
router.post(
  '/contracts/:id/renew',
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const contractId = req.params.id;
    const { new_end_date } = req.body;

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!new_end_date) {
      return res.status(400).json({ error: 'new_end_date is required' });
    }

    const newContract = await contractService.renewContract(
      contractId,
      new Date(new_end_date),
      userId,
      tenantId
    );

    logger.info('Vendor contract renewed', {
      oldContractId: contractId,
      newContractId: newContract.id,
      tenantId,
      userId,
    });

    res.status(201).json({ data: newContract });
  })
);

// ============================================================================
// VENDOR CONTACT ENDPOINTS
// ============================================================================

/**
 * POST /api/vendors/:id/contacts
 * Add a new contact for a vendor
 */
router.post(
  '/:id/contacts',
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const vendorId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contact = await contractService.createContact(
      {
        ...req.body,
        vendor_id: vendorId,
      },
      tenantId
    );

    logger.info('Vendor contact added', {
      contactId: contact.id,
      vendorId,
      tenantId,
    });

    res.status(201).json({ data: contact });
  })
);

/**
 * GET /api/vendors/:id/contacts
 * Get all contacts for a vendor
 */
router.get(
  '/:id/contacts',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const vendorId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contacts = await contractService.getVendorContacts(vendorId, tenantId);

    res.json({
      data: contacts,
      total: contacts.length,
    });
  })
);

/**
 * PUT /api/vendor-contacts/:id
 * Update a vendor contact
 */
router.put(
  '/contacts/:id',
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id;
    const contactId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contact = await contractService.updateContact(
      contactId,
      req.body,
      tenantId
    );

    logger.info('Vendor contact updated', {
      contactId,
      tenantId,
    });

    res.json({ data: contact });
  })
);

export default router;
