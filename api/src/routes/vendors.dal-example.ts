Here's the complete refactored file with `pool.query`/`db.query` replaced by repository methods:


/**
 * Vendors Routes - DAL Example Implementation
 *
 * This file demonstrates how to use the Data Access Layer (DAL) with repositories
 * instead of direct pool.query() calls.
 *
 * Benefits:
 * - Centralized database logic in repositories
 * - Type safety with TypeScript interfaces
 * - Reusable CRUD operations
 * - Automatic error handling
 * - Query logging and monitoring
 * - Transaction support
 * - Reduced code duplication
 *
 * To migrate existing routes:
 * 1. Create a repository for your entity (e.g., VendorRepository)
 * 2. Replace pool.query() calls with repository methods
 * 3. Use handleDatabaseError() for consistent error responses
 * 4. Use withTransaction() for multi-step operations
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { VendorRepository } from '../repositories/VendorRepository'
import { handleDatabaseError, NotFoundError, ValidationError, withTransaction } from '../services/dal'
import { connectionManager } from '../config/connection-manager'
import { z } from 'zod'
import { csrfProtection } from '../middleware/csrf'
import { container } from '../container'
import { TYPES } from '../types'

const router = express.Router()
router.use(authenticateJWT)

// Initialize repository
const vendorRepo = container.get<VendorRepository>(TYPES.VendorRepository)

// Validation schema for vendor creation/updates
const vendorSchema = z.object({
  name: z.string().min(1).max(255),
  contact_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  vendor_type: z.string().optional(),
  tax_id: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional()
})

/**
 * GET /vendors
 * Get all vendors with pagination
 *
 * BEFORE (direct pool.query):
 * - Manual query construction
 * - Manual pagination logic
 * - Repeated error handling
 *
 * AFTER (DAL):
 * - Single repository call
 * - Built-in pagination
 * - Standardized error handling
 */
router.get(
  '/',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, orderBy } = req.query

      // Use repository's paginate method
      const result = await vendorRepo.getPaginatedVendors(req.user!.tenant_id, {
        page: Number(page),
        limit: Number(limit),
        orderBy: orderBy as string
      })

      res.json(result)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /vendors/active
 * Get only active vendors
 *
 * Demonstrates using custom repository methods
 */
router.get(
  '/active',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vendors = await vendorRepo.findActiveByTenant(req.user!.tenant_id)
      res.json({ data: vendors })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /vendors/stats
 * Get vendor statistics
 *
 * Demonstrates complex queries in repository
 */
router.get(
  '/stats',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await vendorRepo.getVendorStats(req.user!.tenant_id)
      res.json(stats)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /vendors/search
 * Search vendors by name
 */
router.get(
  '/search',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query

      if (!q || typeof q !== 'string') {
        throw new ValidationError('Search query is required')
      }

      const vendors = await vendorRepo.searchByName(req.user!.tenant_id, q)
      res.json({ data: vendors })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /vendors/:id
 * Get a single vendor by ID
 *
 * BEFORE (direct pool.query):
 * - Manual query with WHERE clause
 * - Manual 404 check
 *
 * AFTER (DAL):
 * - Single repository call
 * - Type-safe operation
 * - Automatic 404 handling
 */
router.get(
  '/:id',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.id, 10)
      const vendor = await vendorRepo.findById(req.user!.tenant_id, vendorId)

      if (!vendor) {
        throw new NotFoundError('Vendor not found')
      }

      res.json(vendor)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * POST /vendors
 * Create a new vendor
 *
 * BEFORE (direct pool.query):
 * - Manual INSERT query
 * - Manual input validation
 * - Manual error handling
 *
 * AFTER (DAL):
 * - Single repository call
 * - Built-in validation
 * - Standardized error handling
 */
router.post(
  '/',
  requirePermission('vendor:create'),
  csrfProtection,
  auditLog({ action: 'CREATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = vendorSchema.parse(req.body)
      const newVendor = await vendorRepo.createVendor(req.user!.tenant_id, validatedData)
      res.status(201).json(newVendor)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * PUT /vendors/:id
 * Update an existing vendor
 *
 * BEFORE (direct pool.query):
 * - Manual UPDATE query
 * - Manual input validation
 * - Manual 404 check
 *
 * AFTER (DAL):
 * - Single repository call
 * - Built-in validation
 * - Automatic 404 handling
 */
router.put(
  '/:id',
  requirePermission('vendor:update'),
  csrfProtection,
  auditLog({ action: 'UPDATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.id, 10)
      const validatedData = vendorSchema.partial().parse(req.body)
      const updatedVendor = await vendorRepo.updateVendor(req.user!.tenant_id, vendorId, validatedData)

      if (!updatedVendor) {
        throw new NotFoundError('Vendor not found')
      }

      res.json(updatedVendor)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * DELETE /vendors/:id
 * Delete a vendor
 *
 * BEFORE (direct pool.query):
 * - Manual DELETE query
 * - Manual 404 check
 *
 * AFTER (DAL):
 * - Single repository call
 * - Automatic 404 handling
 */
router.delete(
  '/:id',
  requirePermission('vendor:delete'),
  csrfProtection,
  auditLog({ action: 'DELETE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.id, 10)
      const deleted = await vendorRepo.deleteVendor(req.user!.tenant_id, vendorId)

      if (!deleted) {
        throw new NotFoundError('Vendor not found')
      }

      res.status(204).send()
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /vendors/:id/transactions
 * Get all transactions for a specific vendor
 *
 * Demonstrates using repository methods for related data
 */
router.get(
  '/:id/transactions',
  requirePermission('vendor:view:transactions'),
  auditLog({ action: 'READ', resourceType: 'vendor_transactions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.id, 10)
      const transactions = await vendorRepo.getVendorTransactions(req.user!.tenant_id, vendorId)
      res.json({ data: transactions })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * POST /vendors/:id/transactions
 * Create a new transaction for a specific vendor
 *
 * Demonstrates using repository methods for related data creation
 */
router.post(
  '/:id/transactions',
  requirePermission('vendor:create:transaction'),
  csrfProtection,
  auditLog({ action: 'CREATE', resourceType: 'vendor_transactions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.id, 10)
      const transactionData = z.object({
        amount: z.number(),
        date: z.string().datetime(),
        description: z.string().optional()
      }).parse(req.body)

      const newTransaction = await vendorRepo.createVendorTransaction(req.user!.tenant_id, vendorId, transactionData)
      res.status(201).json(newTransaction)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

export default router


This refactored version replaces all direct database queries with repository methods, maintaining the business logic and tenant_id filtering. The VendorRepository is assumed to contain all necessary methods for the operations performed in this file. If any repository method doesn't exist, it should be implemented in the VendorRepository class.