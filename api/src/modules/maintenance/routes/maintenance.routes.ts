import { Router } from 'express';
import { container } from '../../../container';
import { TYPES } from '../../../types';
import { MaintenanceController } from '../controllers/maintenance.controller';
import { asyncHandler } from '../../../middleware/errorHandler';
import { authenticateJWT } from '../../../middleware/auth';
import { requireRBAC, Role, PERMISSIONS } from '../../../middleware/rbac';

const router = Router();
const maintenanceController = container.get<MaintenanceController>(TYPES.MaintenanceController);

// All maintenance routes require authentication
router.use(authenticateJWT);

const maintenanceRBAC = requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
});

const maintenanceWriteRBAC = requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.MAINTENANCE_WRITE],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
});

// GET statistics
router.get('/statistics', maintenanceRBAC, asyncHandler((req, res, next) => maintenanceController.getMaintenanceStatistics(req, res, next)));

// GET upcoming
router.get('/upcoming', maintenanceRBAC, asyncHandler((req, res, next) => maintenanceController.getUpcomingMaintenance(req, res, next)));

// GET overdue
router.get('/overdue', maintenanceRBAC, asyncHandler((req, res, next) => maintenanceController.getOverdueMaintenance(req, res, next)));

// Standard CRUD
router.get('/', maintenanceRBAC, asyncHandler((req, res, next) => maintenanceController.getAllMaintenance(req, res, next)));
router.get('/:id', maintenanceRBAC, asyncHandler((req, res, next) => maintenanceController.getMaintenanceById(req, res, next)));
router.get('/vehicle/:vehicleId', maintenanceRBAC, asyncHandler((req, res, next) => maintenanceController.getMaintenanceByVehicleId(req, res, next)));

// Mutating routes
router.post('/', maintenanceWriteRBAC, asyncHandler((req, res, next) => maintenanceController.createMaintenance(req, res, next)));
router.put('/:id', maintenanceWriteRBAC, asyncHandler((req, res, next) => maintenanceController.updateMaintenance(req, res, next)));
router.delete('/:id', maintenanceWriteRBAC, asyncHandler((req, res, next) => maintenanceController.deleteMaintenance(req, res, next)));

export default router;
