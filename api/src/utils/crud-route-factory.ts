/**
 * CRUD Route Factory - Eliminates 90% of route file duplication
 * Creates standard REST routes with authentication, authorization, validation, caching
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

import { container } from '../container';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRBAC, Role } from '../middleware/rbac';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';

import {
  handleListQuery,
  handleGetById,
  handleCreate,
  handleUpdate,
  handleDelete,
} from './route-helpers';

/**
 * Configuration for CRUD route factory
 */
export interface CRUDRouteConfig {
  // Resource identification
  resource: string; // e.g., 'vehicles', 'drivers'
  resourceType: string; // e.g., 'vehicle', 'driver' (for RBAC)
  logResourceName?: string; // Human-readable name for logs

  // Service configuration
  serviceName: string; // DI container service name
  serviceMethods?: {
    getAll?: string; // Default: 'getAll{Resource}s'
    getById?: string; // Default: 'get{Resource}ById'
    create?: string; // Default: 'create{Resource}'
    update?: string; // Default: 'update{Resource}'
    delete?: string; // Default: 'delete{Resource}'
  };

  // Validation schemas
  schemas: {
    create?: ZodSchema;
    update?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  };

  // Search and filter configuration
  searchFields?: string[]; // Fields to search in
  statusField?: string; // Field name for status filtering (default: 'status')

  // Permissions configuration
  permissions: {
    read?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
  };

  // Role configuration
  roles?: {
    read?: Role[];
    create?: Role[];
    update?: Role[];
    delete?: Role[];
  };

  // Cache configuration
  cacheTTL?: number; // Cache time-to-live in seconds (default: 300)

  // Route customization
  customRoutes?: (router: Router) => void; // Add custom routes
  skipRoutes?: ('list' | 'get' | 'create' | 'update' | 'delete')[]; // Skip standard routes
}

/**
 * Default role configurations
 */
const DEFAULT_ROLES = {
  read: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
  create: [Role.ADMIN, Role.MANAGER],
  update: [Role.ADMIN, Role.MANAGER],
  delete: [Role.ADMIN],
};

/**
 * Generate default service method names
 */
function generateServiceMethods(resource: string) {
  const capitalizedSingular = resource.charAt(0).toUpperCase() + resource.slice(1, -1);
  const capitalizedPlural = resource.charAt(0).toUpperCase() + resource.slice(1);

  return {
    getAll: `getAll${capitalizedPlural}`,
    getById: `get${capitalizedSingular}ById`,
    create: `create${capitalizedSingular}`,
    update: `update${capitalizedSingular}`,
    delete: `delete${capitalizedSingular}`,
  };
}

/**
 * Create CRUD routes with all standard patterns
 */
export function createCRUDRoutes(config: CRUDRouteConfig): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authenticateJWT as any);

  // Generate service method names
  const serviceMethods = {
    ...generateServiceMethods(config.resource),
    ...config.serviceMethods,
  };

  const roles = {
    ...DEFAULT_ROLES,
    ...config.roles,
  };

  const skipRoutes = config.skipRoutes || [];

  // LIST route: GET /
  // LIST route: GET /
  if (!skipRoutes.includes('list')) {
    router.get(
      '/',
      requireRBAC({
        roles: roles.read,
        permissions: config.permissions.read || [],
        enforceTenantIsolation: true,
        resourceType: config.resourceType,
      }) as any,
      config.schemas.query ? validateQuery(config.schemas.query) : ((req: Request, res: Response, next: NextFunction) => next()) as any,
      asyncHandler(async (req: Request, res: Response) => {
        await handleListQuery(
          req,
          res,
          {
            resource: config.resource,
            serviceName: config.serviceName,
            serviceMethod: serviceMethods.getAll!,
            searchFields: config.searchFields,
            statusField: config.statusField,
            cacheTTL: config.cacheTTL,
            logResource: config.logResourceName,
          },
          container
        );
      }) as any
    );
  }

  // GET BY ID route: GET /:id
  if (!skipRoutes.includes('get')) {
    router.get(
      '/:id',
      requireRBAC({
        roles: roles.read,
        permissions: config.permissions.read || [],
        enforceTenantIsolation: true,
        resourceType: config.resourceType,
      }) as any,
      config.schemas.params ? validateParams(config.schemas.params) : ((req: Request, res: Response, next: NextFunction) => next()) as any,
      asyncHandler(async (req: Request, res: Response) => {
        const item = await handleGetById(
          req,
          res,
          {
            resource: config.resource,
            serviceName: config.serviceName,
            serviceMethod: serviceMethods.getById!,
            cacheTTL: config.cacheTTL,
            logResource: config.logResourceName,
          },
          container
        );
        res.json(item);
      }) as any
    );
  }

  // CREATE route: POST /
  if (!skipRoutes.includes('create')) {
    router.post(
      '/',
      requireRBAC({
        roles: roles.create,
        permissions: config.permissions.create || [],
        enforceTenantIsolation: true,
        resourceType: config.resourceType,
      }) as any,
      config.schemas.create ? validateBody(config.schemas.create) : ((req: Request, res: Response, next: NextFunction) => next()) as any,
      asyncHandler(async (req: Request, res: Response) => {
        await handleCreate(
          req,
          res,
          {
            resource: config.resource,
            serviceName: config.serviceName,
            serviceMethod: serviceMethods.create!,
            logResource: config.logResourceName,
          },
          container
        );
      }) as any
    );
  }

  // UPDATE route: PUT /:id
  if (!skipRoutes.includes('update')) {
    router.put(
      '/:id',
      requireRBAC({
        roles: roles.update,
        permissions: config.permissions.update || [],
        enforceTenantIsolation: true,
        resourceType: config.resourceType,
      }) as any,
      config.schemas.params ? validateParams(config.schemas.params) : ((req: Request, res: Response, next: NextFunction) => next()) as any,
      config.schemas.update ? validateBody(config.schemas.update) : ((req: Request, res: Response, next: NextFunction) => next()) as any,
      asyncHandler(async (req: Request, res: Response) => {
        await handleUpdate(
          req,
          res,
          {
            resource: config.resource,
            serviceName: config.serviceName,
            serviceMethod: serviceMethods.update!,
            logResource: config.logResourceName,
          },
          container
        );
      }) as any
    );
  }

  // DELETE route: DELETE /:id
  if (!skipRoutes.includes('delete')) {
    router.delete(
      '/:id',
      requireRBAC({
        roles: roles.delete,
        permissions: config.permissions.delete || [],
        enforceTenantIsolation: true,
        resourceType: config.resourceType,
      }) as any,
      config.schemas.params ? validateParams(config.schemas.params) : ((req: Request, res: Response, next: NextFunction) => next()) as any,
      asyncHandler(async (req: Request, res: Response) => {
        await handleDelete(
          req,
          res,
          {
            resource: config.resource,
            serviceName: config.serviceName,
            serviceMethod: serviceMethods.delete!,
            logResource: config.logResourceName,
          },
          container
        );
      }) as any
    );
  }

  // Add custom routes if provided
  if (config.customRoutes) {
    config.customRoutes(router);
  }

  return router;
}

/**
 * Quick factory for simple CRUD routes
 */
export function simpleCRUD(
  resource: string,
  serviceName: string,
  schemas: CRUDRouteConfig['schemas'],
  searchFields: string[],
  permissions: { read: string[]; create: string[]; update: string[]; delete: string[] }
): Router {
  return createCRUDRoutes({
    resource,
    resourceType: resource.slice(0, -1), // Remove 's' from plural
    serviceName,
    schemas,
    searchFields,
    permissions,
  });
}
