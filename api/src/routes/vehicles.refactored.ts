/**
 * Vehicles Routes - REFACTORED using CRUD Factory
 * Reduced from 238 lines to ~30 lines (87% reduction)
 */

import { createCRUDRoutes } from '../utils/crud-route-factory';
import { PERMISSIONS } from '../middleware/rbac';
import {
import { csrfProtection } from '../middleware/csrf'

  vehicleCreateSchema,
  vehicleUpdateSchema,
  vehicleQuerySchema,
  vehicleIdSchema,
} from '../schemas/vehicles.schema';

const router = createCRUDRoutes({
  resource: 'vehicles',
  resourceType: 'vehicle',
  logResourceName: 'vehicle',

  serviceName: 'vehicleService',

  schemas: {
    create: vehicleCreateSchema,
    update: vehicleUpdateSchema,
    query: vehicleQuerySchema,
    params: vehicleIdSchema,
  },

  searchFields: ['make', 'model', 'vin', 'license_plate'],
  statusField: 'status',

  permissions: {
    read: [PERMISSIONS.VEHICLE_READ],
    create: [PERMISSIONS.VEHICLE_CREATE],
    update: [PERMISSIONS.VEHICLE_UPDATE],
    delete: [PERMISSIONS.VEHICLE_DELETE],
  },

  cacheTTL: 300, // 5 minutes
});

export default router;
