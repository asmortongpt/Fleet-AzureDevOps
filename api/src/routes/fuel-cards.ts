import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../container';
import { NotFoundError } from '../errors/app-error';
import { authenticateJWT } from '../middleware/auth';
import { doubleCsrfProtection as csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';
import { FuelCardService } from '../services/FuelCardService';
import { FuelCardReconciliationService } from '../services/fuel-card-reconciliation';
import { TYPES } from '../types';
import {
  CreateFuelCardInput,
  CreateFuelCardProviderInput,
  CreateFuelCardTransactionInput,
  UpdateFuelCardInput,
  UpdateFuelCardProviderInput,
  UpdateFuelCardTransactionInput,
  FuelCardTransactionFilters,
  BulkImportRequest
} from '../types/fuel-cards';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const fuelCardStatusEnum = z.enum(['active', 'suspended', 'lost', 'expired']);
const reconciliationStatusEnum = z.enum(['pending', 'matched', 'unmatched', 'disputed']);

const createFuelCardProviderSchema = z.object({
  provider_name: z.string().min(1),
  api_endpoint: z.string().optional(),
  api_key: z.string().optional(),
  account_number: z.string().optional(),
  is_active: z.boolean().optional(),
  sync_frequency_minutes: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateFuelCardProviderSchema = z.object({
  provider_name: z.string().min(1).optional(),
  api_endpoint: z.string().optional(),
  api_key: z.string().optional(),
  account_number: z.string().optional(),
  is_active: z.boolean().optional(),
  sync_frequency_minutes: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const createFuelCardSchema = z.object({
  provider_id: z.string().min(1),
  card_number: z.string().min(1),
  card_last4: z.string().length(4),
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
  status: fuelCardStatusEnum.optional(),
  issue_date: z.union([z.string(), z.coerce.date()]),
  expiry_date: z.union([z.string(), z.coerce.date()]),
  daily_limit: z.number().optional(),
  weekly_limit: z.number().optional(),
  monthly_limit: z.number().optional(),
  allowed_fuel_types: z.array(z.string()).optional(),
  allowed_product_codes: z.array(z.string()).optional(),
  pin_required: z.boolean().optional(),
  odometer_required: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateFuelCardSchema = z.object({
  vehicle_id: z.string().nullish(),
  driver_id: z.string().nullish(),
  status: fuelCardStatusEnum.optional(),
  expiry_date: z.union([z.string(), z.coerce.date()]).optional(),
  daily_limit: z.number().nullish(),
  weekly_limit: z.number().nullish(),
  monthly_limit: z.number().nullish(),
  allowed_fuel_types: z.array(z.string()).optional(),
  allowed_product_codes: z.array(z.string()).optional(),
  pin_required: z.boolean().optional(),
  odometer_required: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const createFuelCardTransactionSchema = z.object({
  fuel_card_id: z.string().min(1),
  provider_transaction_id: z.string().optional(),
  transaction_date: z.union([z.string(), z.coerce.date()]),
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
  fuel_type: z.string().min(1),
  gallons: z.number().positive(),
  cost_per_gallon: z.number().nonnegative(),
  total_cost: z.number().nonnegative(),
  odometer_reading: z.number().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  merchant_name: z.string().optional(),
  merchant_address: z.string().optional(),
  product_code: z.string().optional(),
  unit_of_measure: z.string().optional(),
  receipt_url: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const bulkImportSchema = z.object({
  provider_id: z.string().optional(),
  transactions: z.array(createFuelCardTransactionSchema),
  auto_reconcile: z.boolean().default(true),
});

const updateFuelCardTransactionSchema = z.object({
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
  is_approved: z.boolean().optional(),
  is_disputed: z.boolean().optional(),
  dispute_reason: z.string().optional(),
  reconciliation_status: reconciliationStatusEnum.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const disputeSchema = z.object({
  reason: z.string().min(1, 'Dispute reason is required'),
});

const manualReconcileSchema = z.object({
  fuel_card_transaction_id: z.string().min(1),
  fuel_transaction_id: z.string().min(1),
});

const router = Router();

// SECURITY: All routes require authentication
router.use(authenticateJWT);

// ============================================================================
// Fuel Card Providers
// ============================================================================

/**
 * GET /api/fuel-card-providers
 * List all fuel card providers for tenant
 */
router.get('/providers', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const providers = await service.getAllProviders(tenantId);

  res.json({ data: providers, total: providers.length });
}));

/**
 * POST /api/fuel-card-providers
 * Create new fuel card provider
 */
router.post('/providers', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const parsed = createFuelCardProviderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: CreateFuelCardProviderInput = parsed.data;

  const provider = await service.createProvider(data, tenantId);

  res.status(201).json({ data: provider });
}));

/**
 * PUT /api/fuel-card-providers/:id
 * Update fuel card provider
 */
router.put('/providers/:id', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const parsed = updateFuelCardProviderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: UpdateFuelCardProviderInput = parsed.data;

  const provider = await service.updateProvider(req.params.id, data, tenantId);

  if (!provider) {
    throw new NotFoundError('Fuel card provider not found');
  }

  res.json({ data: provider });
}));

// ============================================================================
// Fuel Cards
// ============================================================================

/**
 * GET /api/fuel-cards
 * List all fuel cards with optional filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const { status, vehicle_id, driver_id } = req.query;

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const cards = await service.getAllCards(tenantId, {
    status: status as string,
    vehicle_id: vehicle_id as string,
    driver_id: driver_id as string
  });

  res.json({ data: cards, total: cards.length });
}));

/**
 * GET /api/fuel-cards/:id
 * Get fuel card details
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const card = await service.getCardById(req.params.id, tenantId);

  if (!card) {
    throw new NotFoundError('Fuel card not found');
  }

  res.json({ data: card });
}));

/**
 * POST /api/fuel-cards
 * Create new fuel card
 */
router.post('/', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const parsed = createFuelCardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: CreateFuelCardInput = parsed.data;

  const card = await service.createCard(data, tenantId);

  res.status(201).json({ data: card });
}));

/**
 * PUT /api/fuel-cards/:id
 * Update fuel card
 */
router.put('/:id', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const parsed = updateFuelCardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: UpdateFuelCardInput = parsed.data;

  const card = await service.updateCard(req.params.id, data, tenantId);

  if (!card) {
    throw new NotFoundError('Fuel card not found');
  }

  res.json({ data: card });
}));

/**
 * DELETE /api/fuel-cards/:id
 * Soft delete fuel card (sets status to 'suspended')
 */
router.delete('/:id', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const deleted = await service.deleteCard(req.params.id, tenantId);

  if (!deleted) {
    throw new NotFoundError('Fuel card not found');
  }

  res.json({ success: true, message: 'Fuel card suspended successfully' });
}));

/**
 * GET /api/fuel-cards/:id/transactions
 * Get all transactions for a specific fuel card
 */
router.get('/:id/transactions', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const { page, pageSize } = req.query;

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const result = await service.getCardTransactions(
    req.params.id,
    tenantId,
    {
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20
    }
  );

  res.json({
    data: result.data,
    total: result.total,
    page: page ? parseInt(page as string) : 1,
    pageSize: pageSize ? parseInt(pageSize as string) : 20
  });
}));

// ============================================================================
// Fuel Card Transactions
// ============================================================================

/**
 * GET /api/fuel-card-transactions
 * List all fuel card transactions with filters
 */
router.get('/transactions', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const {
    page,
    pageSize,
    fuel_card_id,
    vehicle_id,
    driver_id,
    reconciliation_status,
    is_disputed,
    start_date,
    end_date,
    min_amount,
    max_amount,
    search
  } = req.query;

  const filters: FuelCardTransactionFilters = {
    fuel_card_id: fuel_card_id as string,
    vehicle_id: vehicle_id as string,
    driver_id: driver_id as string,
    reconciliation_status: reconciliation_status as FuelCardTransactionFilters['reconciliation_status'],
    is_disputed: is_disputed === 'true',
    start_date: start_date as string,
    end_date: end_date as string,
    min_amount: min_amount ? parseFloat(min_amount as string) : undefined,
    max_amount: max_amount ? parseFloat(max_amount as string) : undefined,
    search: search as string
  };

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const result = await service.getAllTransactions(tenantId, filters, {
    page: page ? parseInt(page as string) : 1,
    pageSize: pageSize ? parseInt(pageSize as string) : 20
  });

  res.json({
    data: result.data,
    total: result.total,
    page: page ? parseInt(page as string) : 1,
    pageSize: pageSize ? parseInt(pageSize as string) : 20
  });
}));

/**
 * GET /api/fuel-card-transactions/:id
 * Get specific fuel card transaction
 */
router.get('/transactions/:id', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const transaction = await service.getTransactionById(req.params.id, tenantId);

  if (!transaction) {
    throw new NotFoundError('Fuel card transaction not found');
  }

  res.json({ data: transaction });
}));

/**
 * POST /api/fuel-card-transactions/import
 * Bulk import fuel card transactions from provider
 */
router.post('/transactions/import', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const parsed = bulkImportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { transactions, auto_reconcile } = parsed.data;

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);

  const importResult = {
    success: true,
    imported_count: 0,
    skipped_count: 0,
    error_count: 0,
    transaction_ids: [] as string[],
    errors: [] as { row: number; error: string; data: unknown }[]
  };

  // Import each transaction
  for (let i = 0; i < transactions.length; i++) {
    try {
      const transaction = await service.createTransaction(transactions[i], tenantId);
      importResult.imported_count++;
      importResult.transaction_ids.push(transaction.id);
    } catch (error: unknown) {
      importResult.error_count++;
      importResult.errors.push({
        row: i,
        error: 'An internal error occurred',
        data: transactions[i]
      });
    }
  }

  // Auto-reconcile if requested
  let reconciliationResult;
  if (auto_reconcile && importResult.imported_count > 0) {
    reconciliationResult = await reconciliationService.reconcilePendingTransactions(tenantId);
  }

  res.status(201).json({
    ...importResult,
    reconciliation_result: reconciliationResult
  });
}));

/**
 * POST /api/fuel-card-transactions/reconcile
 * Run auto-reconciliation on pending transactions
 */
router.post('/transactions/reconcile', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);
  const result = await reconciliationService.reconcilePendingTransactions(tenantId);

  res.json({ data: result });
}));

/**
 * POST /api/fuel-card-transactions/:id/dispute
 * Dispute a fuel card transaction
 */
router.post('/transactions/:id/dispute', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  const userId = req.user?.id;
  if (!tenantId || !userId) {
    throw new Error('Tenant ID and User ID are required');
  }

  const parsed = disputeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { reason } = parsed.data;

  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);
  await reconciliationService.disputeTransaction(req.params.id, reason, userId, tenantId);

  res.json({ success: true, message: 'Transaction disputed successfully' });
}));

/**
 * POST /api/fuel-card-transactions/manual-reconcile
 * Manually link a fuel card transaction to a fuel transaction
 */
router.post('/transactions/manual-reconcile', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  const userId = req.user?.id;
  if (!tenantId || !userId) {
    throw new Error('Tenant ID and User ID are required');
  }

  const parsed = manualReconcileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { fuel_card_transaction_id, fuel_transaction_id } = parsed.data;

  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);
  await reconciliationService.manualReconcile(
    fuel_card_transaction_id,
    fuel_transaction_id,
    tenantId,
    userId
  );

  res.json({ success: true, message: 'Transactions manually reconciled successfully' });
}));

/**
 * PUT /api/fuel-card-transactions/:id
 * Update fuel card transaction (approval, dispute, etc.)
 */
router.put('/transactions/:id', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const parsed = updateFuelCardTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: UpdateFuelCardTransactionInput = parsed.data;

  const transaction = await service.updateTransaction(req.params.id, data, tenantId);

  if (!transaction) {
    throw new NotFoundError('Fuel card transaction not found');
  }

  res.json({ data: transaction });
}));

// ============================================================================
// Reporting & Analytics
// ============================================================================

/**
 * GET /api/fuel-cards/utilization
 * Get fuel card utilization summary
 */
router.get('/utilization', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const utilization = await service.getCardUtilization(tenantId);

  res.json({ data: utilization });
}));

/**
 * GET /api/fuel-card-transactions/fraud-alerts
 * Get fraud detection alerts
 */
router.get('/transactions/fraud-alerts', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const { vehicle_id } = req.query;

  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);
  const alerts = await reconciliationService.detectFraud(tenantId, vehicle_id as string);

  res.json({ data: alerts, total: alerts.length });
}));

export default router;
