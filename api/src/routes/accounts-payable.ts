/**
 * Accounts Payable & Depreciation API Routes
 * Handles AP tracking, aging reports, cash flow forecasting, and depreciation calculations
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateJWT } from '../middleware/auth';
import { APAgingService } from '../services/ap-aging';
import { DepreciationService } from '../services/depreciation';
import { db } from '../db';
import {
  CreateAccountsPayableInput,
  PaymentInput,
  APQueryOptions,
  CreateDepreciationInput
} from '../types/accounts-payable';
import { logger } from '../utils/logger';

const router = Router();

// Initialize services
const apAgingService = new APAgingService(db as unknown as Pool);
const depreciationService = new DepreciationService(db as unknown as Pool);

// ============================================================================
// ACCOUNTS PAYABLE ROUTES
// ============================================================================

/**
 * GET /api/accounts-payable
 * List all AP records with filtering and pagination
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenant_id as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const options: APQueryOptions = {
      tenant_id: tenantId,
      vendor_id: req.query.vendor_id as string,
      status: req.query.status as any,
      aging_bucket: req.query.aging_bucket as any,
      due_date_from: req.query.due_date_from ? new Date(req.query.due_date_from as string) : undefined,
      due_date_to: req.query.due_date_to ? new Date(req.query.due_date_to as string) : undefined,
      min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
      max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await apAgingService.listAP(options);
    res.json(result);
  } catch (error) {
    logger.error('Error listing AP records:', error);
    res.status(500).json({ error: 'Failed to list AP records', details: String(error) });
  }
});

/**
 * POST /api/accounts-payable
 * Create a new AP record
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const input: CreateAccountsPayableInput = {
      tenant_id: req.user?.tenantId || req.body.tenant_id,
      ...req.body
    };

    // Convert date strings to Date objects
    if (input.invoice_date) {
      input.invoice_date = new Date(input.invoice_date);
    }
    if (input.due_date) {
      input.due_date = new Date(input.due_date);
    }
    if (input.discount_date) {
      input.discount_date = new Date(input.discount_date);
    }

    const ap = await apAgingService.createAP(input);
    res.status(201).json(ap);
  } catch (error) {
    logger.error('Error creating AP record:', error);
    res.status(500).json({ error: 'Failed to create AP record', details: String(error) });
  }
});

/**
 * POST /api/accounts-payable/:id/pay
 * Record a payment against an AP record
 */
router.post('/:id/pay', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment: PaymentInput = {
      ...req.body,
      paid_date: new Date(req.body.paid_date || new Date())
    };

    const updatedAP = await apAgingService.recordPayment(id, payment);
    res.json(updatedAP);
  } catch (error) {
    logger.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/aging-report
 * Generate AP aging report
 */
router.get('/aging-report', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenant_id as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const report = await apAgingService.generateAgingReport(tenantId);
    res.json(report);
  } catch (error) {
    logger.error('Error generating aging report:', error);
    res.status(500).json({ error: 'Failed to generate aging report', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/cash-flow-forecast
 * Generate cash flow forecast
 */
router.get('/cash-flow-forecast', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenant_id as string;
    const daysAhead = req.query.days_ahead ? parseInt(req.query.days_ahead as string) : 90;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const forecast = await apAgingService.generateCashFlowForecast(tenantId, daysAhead);
    res.json(forecast);
  } catch (error) {
    logger.error('Error generating cash flow forecast:', error);
    res.status(500).json({ error: 'Failed to generate forecast', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/overdue
 * Get overdue invoices
 */
router.get('/overdue', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenant_id as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const overdueInvoices = await apAgingService.getOverdueInvoices(tenantId);
    res.json(overdueInvoices);
  } catch (error) {
    logger.error('Error fetching overdue invoices:', error);
    res.status(500).json({ error: 'Failed to fetch overdue invoices', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/metrics
 * Get AP dashboard metrics
 */
router.get('/metrics', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenant_id as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const metrics = await apAgingService.getDashboardMetrics(tenantId);
    const dpo = await apAgingService.calculateDPO(tenantId);

    res.json({
      ...metrics,
      days_payable_outstanding: dpo
    });
  } catch (error) {
    logger.error('Error fetching AP metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/discount-opportunities
 * Get early payment discount opportunities
 */
router.get('/discount-opportunities', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenant_id as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const opportunities = await apAgingService.getDiscountOpportunities(tenantId);
    res.json(opportunities);
  } catch (error) {
    logger.error('Error fetching discount opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/vendor/:vendorId/history
 * Get payment history for a vendor
 */
router.get('/vendor/:vendorId/history', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const history = await apAgingService.getVendorPaymentHistory(vendorId, limit);
    const avgDaysToPay = await apAgingService.getVendorAverageDaysToPay(vendorId);

    res.json({
      history,
      average_days_to_pay: avgDaysToPay
    });
  } catch (error) {
    logger.error('Error fetching vendor payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history', details: String(error) });
  }
});

// ============================================================================
// DEPRECIATION ROUTES
// ============================================================================

/**
 * POST /api/accounts-payable/depreciation
 * Create a depreciation record for an asset
 */
router.post('/depreciation', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const input: CreateDepreciationInput = {
      tenant_id: req.user?.tenantId || req.body.tenant_id,
      ...req.body
    };

    // Convert date to Date object
    if (input.start_date) {
      input.start_date = new Date(input.start_date);
    }

    const depreciation = await depreciationService.createDepreciation(input);
    res.status(201).json(depreciation);
  } catch (error) {
    logger.error('Error creating depreciation record:', error);
    res.status(500).json({ error: 'Failed to create depreciation record', details: String(error) });
  }
});

/**
 * POST /api/accounts-payable/depreciation/:id/calculate
 * Calculate depreciation for a specific period
 */
router.post('/depreciation/:id/calculate', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period_start, period_end, units_used } = req.body;

    if (!period_start || !period_end) {
      return res.status(400).json({ error: 'period_start and period_end are required' });
    }

    const result = await depreciationService.calculatePeriodDepreciation(
      id,
      new Date(period_start),
      new Date(period_end),
      units_used ? parseInt(units_used) : undefined
    );

    res.json(result);
  } catch (error) {
    logger.error('Error calculating depreciation:', error);
    res.status(500).json({ error: 'Failed to calculate depreciation', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/depreciation/:id/schedule
 * Get depreciation schedule for an asset
 */
router.get('/depreciation/:id/schedule', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await depreciationService.getDepreciationSchedule(id);
    res.json(schedule);
  } catch (error) {
    logger.error('Error fetching depreciation schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/depreciation/:id/project
 * Project future depreciation schedule
 */
router.get('/depreciation/:id/project', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const periods = req.query.periods ? parseInt(req.query.periods as string) : 12;

    const projection = await depreciationService.projectDepreciationSchedule(id, periods);
    res.json(projection);
  } catch (error) {
    logger.error('Error projecting depreciation:', error);
    res.status(500).json({ error: 'Failed to project depreciation', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/depreciation/monthly-journal
 * Generate monthly depreciation journal entries
 */
router.get('/depreciation/monthly-journal', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenant_id as string;
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const journal = await depreciationService.generateMonthlyJournal(tenantId, year, month);
    res.json(journal);
  } catch (error) {
    logger.error('Error generating monthly journal:', error);
    res.status(500).json({ error: 'Failed to generate journal', details: String(error) });
  }
});

/**
 * GET /api/accounts-payable/depreciation/summary
 * Get depreciation summary for tenant
 */
router.get('/depreciation/summary', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenant_id as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const summary = await depreciationService.getDepreciationSummary(tenantId);
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching depreciation summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary', details: String(error) });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/accounts-payable/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'accounts-payable',
    version: '1.0.0'
  });
});

export default router;
