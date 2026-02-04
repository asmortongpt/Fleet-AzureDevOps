import { Router, Request, Response } from 'express';
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
  const tenantId = (req as any).user?.tenant_id;
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
  const tenantId = (req as any).user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: CreateFuelCardProviderInput = req.body;

  const provider = await service.createProvider(data, tenantId);

  res.status(201).json({ data: provider });
}));

/**
 * PUT /api/fuel-card-providers/:id
 * Update fuel card provider
 */
router.put('/providers/:id', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: UpdateFuelCardProviderInput = req.body;

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
  const tenantId = (req as any).user?.tenant_id;
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
  const tenantId = (req as any).user?.tenant_id;
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
  const tenantId = (req as any).user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: CreateFuelCardInput = req.body;

  const card = await service.createCard(data, tenantId);

  res.status(201).json({ data: card });
}));

/**
 * PUT /api/fuel-cards/:id
 * Update fuel card
 */
router.put('/:id', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: UpdateFuelCardInput = req.body;

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
  const tenantId = (req as any).user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const deleted = await service.deleteCard(req.params.id, tenantId);

  if (!deleted) {
    throw new NotFoundError('Fuel card not found');
  }

  res.json({ message: 'Fuel card suspended successfully' });
}));

/**
 * GET /api/fuel-cards/:id/transactions
 * Get all transactions for a specific fuel card
 */
router.get('/:id/transactions', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenant_id;
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
  const tenantId = (req as any).user?.tenant_id;
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
    reconciliation_status: reconciliation_status as any,
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
  const tenantId = (req as any).user?.tenant_id;
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
  const tenantId = (req as any).user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const { transactions, auto_reconcile = true }: BulkImportRequest = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    throw new Error('Transactions array is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);

  const importResult = {
    success: true,
    imported_count: 0,
    skipped_count: 0,
    error_count: 0,
    transaction_ids: [] as string[],
    errors: [] as any[]
  };

  // Import each transaction
  for (let i = 0; i < transactions.length; i++) {
    try {
      const transaction = await service.createTransaction(transactions[i], tenantId);
      importResult.imported_count++;
      importResult.transaction_ids.push(transaction.id);
    } catch (error: any) {
      importResult.error_count++;
      importResult.errors.push({
        row: i,
        error: error.message,
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
  const tenantId = (req as any).user?.tenant_id;
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
  const tenantId = (req as any).user?.tenant_id;
  const userId = (req as any).user?.id;
  if (!tenantId || !userId) {
    throw new Error('Tenant ID and User ID are required');
  }

  const { reason } = req.body;
  if (!reason) {
    throw new Error('Dispute reason is required');
  }

  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);
  await reconciliationService.disputeTransaction(req.params.id, reason, userId, tenantId);

  res.json({ message: 'Transaction disputed successfully' });
}));

/**
 * POST /api/fuel-card-transactions/manual-reconcile
 * Manually link a fuel card transaction to a fuel transaction
 */
router.post('/transactions/manual-reconcile', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenant_id;
  const userId = (req as any).user?.id;
  if (!tenantId || !userId) {
    throw new Error('Tenant ID and User ID are required');
  }

  const { fuel_card_transaction_id, fuel_transaction_id } = req.body;
  if (!fuel_card_transaction_id || !fuel_transaction_id) {
    throw new Error('Both transaction IDs are required');
  }

  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);
  await reconciliationService.manualReconcile(
    fuel_card_transaction_id,
    fuel_transaction_id,
    tenantId,
    userId
  );

  res.json({ message: 'Transactions manually reconciled successfully' });
}));

/**
 * PUT /api/fuel-card-transactions/:id
 * Update fuel card transaction (approval, dispute, etc.)
 */
router.put('/transactions/:id', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const service = container.get<FuelCardService>(TYPES.FuelCardService);
  const data: UpdateFuelCardTransactionInput = req.body;

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
  const tenantId = (req as any).user?.tenant_id;
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
  const tenantId = (req as any).user?.tenant_id;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const { vehicle_id } = req.query;

  const reconciliationService = container.get<FuelCardReconciliationService>(TYPES.FuelCardReconciliationService);
  const alerts = await reconciliationService.detectFraud(tenantId, vehicle_id as string);

  res.json({ data: alerts, total: alerts.length });
}));

export default router;
