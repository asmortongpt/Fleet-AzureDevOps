/**
 * Drivers Routes - REFACTORED using CRUD Factory
 * Reduced from 240+ lines to ~30 lines (87% reduction)
 */

import { createCRUDRoutes } from '../utils/crud-route-factory';
import { PERMISSIONS } from '../middleware/rbac';
import {
  driverCreateSchema,
  driverUpdateSchema,
  driverQuerySchema,
  driverIdSchema,
} from '../schemas/drivers.schema';

const router = createCRUDRoutes({
  resource: 'drivers',
  resourceType: 'driver',
  logResourceName: 'driver',

  serviceName: 'driverService',

  schemas: {
    create: driverCreateSchema,
    update: driverUpdateSchema,
    query: driverQuerySchema,
    params: driverIdSchema,
  },

  searchFields: ['first_name', 'last_name', 'email', 'license_number'],
  statusField: 'status',

  permissions: {
    read: [PERMISSIONS.DRIVER_READ],
    create: [PERMISSIONS.DRIVER_CREATE],
    update: [PERMISSIONS.DRIVER_UPDATE],
    delete: [PERMISSIONS.DRIVER_DELETE],
  },

  cacheTTL: 300, // 5 minutes
});

export default router;
