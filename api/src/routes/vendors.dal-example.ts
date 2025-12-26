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
import { z } from 'zod'

import { connectionManager } from '../config/connection-manager'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { VendorRepository } from '../repositories/VendorRepository'
import { handleDatabaseError, NotFoundError, ValidationError, withTransaction } from '../services/dal'



const router = express.Router()
router.use(authenticateJWT)

// Initialize repository
const vendorRepo = new VendorRepository()

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
 */
router.get(
  '/:id',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vendor = await vendorRepo.findByIdAndTenant(req.params.id, req.user!.tenant_id)

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
 */
router.post(
  '/',
  csrfProtection, requirePermission('vendor:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate input
      const validatedData = vendorSchema.parse(req.body)

      // Check for duplicate email
      if (validatedData.email) {
        const exists = await vendorRepo.existsByEmail(req.user!.tenant_id, validatedData.email)
        if (exists) {
          throw new ValidationError('Vendor with this email already exists')
        }
      }

      // Create vendor
      const vendor = await vendorRepo.createVendor(req.user!.tenant_id, validatedData)

      res.status(201).json(vendor)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }

      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * PUT /vendors/:id
 * Update a vendor
 */
router.put(
  '/:id',
  csrfProtection, requirePermission('vendor:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate input (partial schema for updates)
      const validatedData = vendorSchema.partial().parse(req.body)

      // Check for duplicate email if changing
      if (validatedData.email) {
        const existing = await vendorRepo.findByIdAndTenant(req.params.id, req.user!.tenant_id)
        if (existing && existing.email !== validatedData.email) {
          const exists = await vendorRepo.existsByEmail(req.user!.tenant_id, validatedData.email)
          if (exists) {
            throw new ValidationError('Vendor with this email already exists')
          }
        }
      }

      // Update vendor
      const vendor = await vendorRepo.updateVendor(
        req.params.id,
        req.user!.tenant_id,
        validatedData
      )

      res.json(vendor)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }

      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * DELETE /vendors/:id
 * Delete a vendor
 */
router.delete(
  '/:id',
  csrfProtection, requirePermission('vendor:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await vendorRepo.deleteVendor(req.params.id, req.user!.tenant_id)

      if (!deleted) {
        throw new NotFoundError('Vendor not found')
      }

      res.json({ message: 'Vendor deleted successfully' })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * POST /vendors/:id/deactivate
 * Soft delete a vendor (set is_active = false)
 */
router.post(
  '/:id/deactivate',
  csrfProtection, requirePermission('vendor:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vendor = await vendorRepo.updateVendor(
        req.params.id,
        req.user!.tenant_id,
        { is_active: false }
      )

      res.json(vendor)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * POST /vendors/bulk
 * Bulk create vendors
 */
router.post(
  '/bulk',
  csrfProtection, requirePermission('vendor:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vendors } = req.body

      if (!Array.isArray(vendors) || vendors.length === 0) {
        throw new ValidationError('Vendors array is required')
      }

      // Validate all vendors
      const validatedVendors = vendors.map(v => vendorSchema.parse(v))

      // Use transaction for atomic bulk insert
      const createdVendors = await withTransaction(
        connectionManager.getWritePool(),
        async (client) => {
          const results = []

          for (const vendorData of validatedVendors) {
            const vendor = await vendorRepo.createVendor(req.user!.tenant_id, vendorData)
            results.push(vendor)
          }

          return results
        }
      )

      res.status(201).json({
        message: `${createdVendors.length} vendors created successfully`,
        data: createdVendors
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }

      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

export default router
