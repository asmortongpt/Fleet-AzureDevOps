Here's the complete refactored `deployments.ts` file using repository methods instead of `pool.query`:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';
import { createAuditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { DeploymentRepository } from '../repositories/deploymentRepository';
import { UserRepository } from '../repositories/userRepository';

const router = express.Router();
router.use(authenticateJWT);

const deploymentRepository = container.resolve<DeploymentRepository>(DeploymentRepository);
const userRepository = container.resolve<UserRepository>(UserRepository);

/**
 * GET /api/deployments
 * Get deployment history with optional filtering
 */
router.get('/',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { environment, status, limit = 20 } = req.query;

      const deployments = await deploymentRepository.getDeployments({
        environment: environment as string,
        status: status as string,
        limit: parseInt(limit as string, 10)
      });

      const deploymentsWithDetails = await Promise.all(deployments.map(async (deployment) => {
        const deployedByUser = await userRepository.getUserById(deployment.deployed_by_user_id);
        const qualityGates = await deploymentRepository.getQualityGatesForDeployment(deployment.id);

        return {
          ...deployment,
          deployed_by_name: deployedByUser ? `${deployedByUser.first_name} ${deployedByUser.last_name}` : null,
          quality_gates: qualityGates
        };
      }));

      res.json({
        deployments: deploymentsWithDetails,
        total: deploymentsWithDetails.length
      });
    } catch (error: any) {
      logger.error(`Error fetching deployments:`, error);
      res.status(500).json({ error: 'Failed to fetch deployments', message: getErrorMessage(error) });
    }
  }
);

/**
 * POST /api/deployments
 * Create a new deployment record
 */
router.post('/',
  csrfProtection,
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        tenant_id,
        environment,
        version,
        commit_hash,
        branch,
        deployed_by_user_id,
        deployment_notes,
        metadata = {}
      } = req.body;

      // Validate required fields
      if (!environment) {
        throw new ValidationError("environment is required");
      }

      // Validate environment
      const validEnvironments = ['development', 'staging', 'production'];
      if (!validEnvironments.includes(environment)) {
        return res.status(400).json({
          error: 'Invalid environment',
          valid_environments: validEnvironments
        });
      }

      const newDeployment = await deploymentRepository.createDeployment({
        tenant_id,
        environment,
        version,
        commit_hash,
        branch,
        deployed_by_user_id,
        status: 'pending',
        deployment_notes,
        metadata
      });

      // Create audit log
      if (req.user?.id) {
        await createAuditLog(
          req.user.tenant_id || null,
          req.user.id,
          `CREATE`,
          'deployment',
          newDeployment.id,
          { environment, version, commit_hash },
          req.ip || null,
          req.get('user-agent') || null,
          'success'
        );
      }

      res.status(201).json(newDeployment);
    } catch (error: any) {
      logger.error(`Error creating deployment:`, error);
      res.status(500).json({ error: 'Failed to create deployment', message: getErrorMessage(error) });
    }
  }
);

/**
 * GET /api/deployments/:id
 * Get a specific deployment by ID
 */
router.get('/:id',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const deploymentId = parseInt(req.params.id, 10);
      const deployment = await deploymentRepository.getDeploymentById(deploymentId);

      if (!deployment) {
        throw new NotFoundError('Deployment not found');
      }

      const deployedByUser = await userRepository.getUserById(deployment.deployed_by_user_id);
      const qualityGates = await deploymentRepository.getQualityGatesForDeployment(deployment.id);

      const deploymentWithDetails = {
        ...deployment,
        deployed_by_name: deployedByUser ? `${deployedByUser.first_name} ${deployedByUser.last_name}` : null,
        quality_gates: qualityGates
      };

      res.json(deploymentWithDetails);
    } catch (error: any) {
      logger.error(`Error fetching deployment:`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: 'Deployment not found' });
      } else {
        res.status(500).json({ error: 'Failed to fetch deployment', message: getErrorMessage(error) });
      }
    }
  }
);

/**
 * PUT /api/deployments/:id
 * Update a specific deployment by ID
 */
router.put('/:id',
  csrfProtection,
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const deploymentId = parseInt(req.params.id, 10);
      const {
        status,
        deployment_notes,
        metadata = {}
      } = req.body;

      const updatedDeployment = await deploymentRepository.updateDeployment(deploymentId, {
        status,
        deployment_notes,
        metadata
      });

      if (!updatedDeployment) {
        throw new NotFoundError('Deployment not found');
      }

      // Create audit log
      if (req.user?.id) {
        await createAuditLog(
          req.user.tenant_id || null,
          req.user.id,
          `UPDATE`,
          'deployment',
          deploymentId,
          { status, deployment_notes },
          req.ip || null,
          req.get('user-agent') || null,
          'success'
        );
      }

      res.json(updatedDeployment);
    } catch (error: any) {
      logger.error(`Error updating deployment:`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: 'Deployment not found' });
      } else {
        res.status(500).json({ error: 'Failed to update deployment', message: getErrorMessage(error) });
      }
    }
  }
);

/**
 * DELETE /api/deployments/:id
 * Delete a specific deployment by ID
 */
router.delete('/:id',
  csrfProtection,
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const deploymentId = parseInt(req.params.id, 10);

      const deleted = await deploymentRepository.deleteDeployment(deploymentId);

      if (!deleted) {
        throw new NotFoundError('Deployment not found');
      }

      // Create audit log
      if (req.user?.id) {
        await createAuditLog(
          req.user.tenant_id || null,
          req.user.id,
          `DELETE`,
          'deployment',
          deploymentId,
          {},
          req.ip || null,
          req.get('user-agent') || null,
          'success'
        );
      }

      res.status(204).send();
    } catch (error: any) {
      logger.error(`Error deleting deployment:`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: 'Deployment not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete deployment', message: getErrorMessage(error) });
      }
    }
  }
);

export default router;


This refactored version of `deployments.ts` replaces all `pool.query` calls with repository methods. The `DeploymentRepository` and `UserRepository` are resolved from the dependency injection container and used throughout the file.

The main changes include:

1. Importing `DeploymentRepository` and `UserRepository` from their respective files.
2. Resolving instances of these repositories using the dependency injection container.
3. Replacing all database queries with corresponding repository methods:
   - `getDeployments`
   - `getDeploymentById`
   - `getQualityGatesForDeployment`
   - `createDeployment`
   - `updateDeployment`
   - `deleteDeployment`
4. Using `userRepository.getUserById` to fetch user details.

The overall structure and functionality of the file remain the same, but the data access layer has been abstracted into repository classes, improving separation of concerns and making the code more maintainable and testable.