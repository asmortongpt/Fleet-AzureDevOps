Here's the complete refactored version of the `communications.enhanced.ts` file, including all route handlers and the necessary imports:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { cacheMiddleware, invalidateOnWrite, CacheStrategies } from '../middleware/cache';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { serialize } from 'node-html-encoder';
import { csrfProtection } from '../middleware/csrf';
import { CommunicationRepository } from '../repositories/communication.repository';
import { UserRepository } from '../repositories/user.repository';

const router = express.Router();

// Import the necessary repositories
const communicationRepository = container.resolve(CommunicationRepository);
const userRepository = container.resolve(UserRepository);

router.use(helmet());
router.use(authenticateJWT);
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const communicationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  communication_type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

// GET /communications (CACHED: 5 minutes, vary by tenant and query params)
router.get(
  '/',
  requirePermission('communication:view:global'),
  cacheMiddleware({ ttl: 300000, varyByTenant: true, varyByQuery: true }),
  auditLog({ action: 'READ', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validationResult = communicationQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError("Invalid query parameters");
      }

      const {
        page = '1',
        limit = '50',
        communication_type,
        category,
        priority,
        status,
        search,
      } = validationResult.data;

      const offset = (Number(page) - 1) * Number(limit);

      const communications = await communicationRepository.getCommunications({
        tenantId: req.user!.tenant_id,
        communicationType: communication_type,
        category,
        priority,
        status,
        search,
        limit: Number(limit),
        offset,
      });

      res.json(communications);
    } catch (error) {
      console.error('Error fetching communications:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// GET /communications/:id (CACHED: 5 minutes, vary by tenant)
router.get(
  '/:id',
  requirePermission('communication:view'),
  cacheMiddleware({ ttl: 300000, varyByTenant: true }),
  auditLog({ action: 'READ', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const communicationId = req.params.id;
      const communication = await communicationRepository.getCommunicationById(communicationId, req.user!.tenant_id);

      if (!communication) {
        throw new NotFoundError('Communication not found');
      }

      res.json(communication);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Error fetching communication:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
);

const createCommunicationSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  communication_type: z.string().min(1),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
});

// POST /communications
router.post(
  '/',
  requirePermission('communication:create'),
  csrfProtection,
  invalidateOnWrite(CacheStrategies.INVALIDATE_ALL),
  auditLog({ action: 'CREATE', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validationResult = createCommunicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError("Invalid communication data");
      }

      const newCommunication = await communicationRepository.createCommunication({
        ...validationResult.data,
        tenantId: req.user!.tenant_id,
        createdBy: req.user!.id,
      });

      res.status(201).json(newCommunication);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Error creating communication:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
);

const updateCommunicationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  communication_type: z.string().min(1).optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
});

// PUT /communications/:id
router.put(
  '/:id',
  requirePermission('communication:update'),
  csrfProtection,
  invalidateOnWrite(CacheStrategies.INVALIDATE_ALL),
  auditLog({ action: 'UPDATE', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const communicationId = req.params.id;
      const validationResult = updateCommunicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError("Invalid communication data");
      }

      const updatedCommunication = await communicationRepository.updateCommunication(
        communicationId,
        req.user!.tenant_id,
        {
          ...validationResult.data,
          updatedBy: req.user!.id,
        }
      );

      if (!updatedCommunication) {
        throw new NotFoundError('Communication not found');
      }

      res.json(updatedCommunication);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Error updating communication:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
);

// DELETE /communications/:id
router.delete(
  '/:id',
  requirePermission('communication:delete'),
  csrfProtection,
  invalidateOnWrite(CacheStrategies.INVALIDATE_ALL),
  auditLog({ action: 'DELETE', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const communicationId = req.params.id;
      const deleted = await communicationRepository.deleteCommunication(communicationId, req.user!.tenant_id);

      if (!deleted) {
        throw new NotFoundError('Communication not found');
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Error deleting communication:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
);

export default router;


This refactored version of the `communications.enhanced.ts` file has eliminated all direct database queries and replaced them with repository method calls. The necessary repositories (`CommunicationRepository` and `UserRepository`) are imported at the top of the file.

All business logic has been maintained, and tenant_id filtering is still in place where appropriate. The file now returns a complete refactored version that adheres to the given instructions.

Note that some repository methods (like `getCommunications`, `getCommunicationById`, `createCommunication`, `updateCommunication`, and `deleteCommunication`) are assumed to exist in the `CommunicationRepository`. If they don't exist, they should be implemented in the respective repository files.

The `UserRepository` is imported but not used in this file. It's included as an example of how to import additional repositories if needed in the future.