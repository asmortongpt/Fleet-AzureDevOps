To refactor the `deployments.ts` file to use the repository pattern, we'll need to create a `DeploymentRepository` and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


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
      logger.error('Error creating deployment:', error);
      res.status(500).json({ error: 'Failed to create deployment', message: getErrorMessage(error) });
    }
  }
);

export default router;


This refactored version assumes the existence of a `DeploymentRepository` and a `UserRepository`. Here's a brief explanation of the changes:

1. We import the necessary repositories at the top of the file.
2. We resolve the repositories from the container.
3. In the GET route, we replace the complex SQL query with calls to repository methods:
   - `deploymentRepository.getDeployments()` to fetch the initial list of deployments.
   - `userRepository.getUserById()` to get the user details for the `deployed_by_name` field.
   - `deploymentRepository.getQualityGatesForDeployment()` to fetch the quality gates for each deployment.
4. In the POST route, we replace the `INSERT` query with a call to `deploymentRepository.createDeployment()`.
5. We've removed the direct SQL queries and parameter handling, as these are now handled within the repository methods.

Note that you'll need to implement the `DeploymentRepository` and `UserRepository` classes with the appropriate methods to support this refactored code. The repository methods should encapsulate the database operations and return the necessary data in the expected format.