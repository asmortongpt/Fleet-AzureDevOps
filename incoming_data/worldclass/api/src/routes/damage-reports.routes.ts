/**
 * Damage Reports Routes
 *
 * RESTful API routes for damage report management
 *
 * @module routes/damage-reports
 */

import { Router } from 'express';
import { damageReportsController   updateDamageAnnotations
} from '../controllers/damage-reports.controller';

const router = Router();

/**
 * @route   GET /api/damage-reports
 * @desc    Get all damage reports with optional filters
 * @access  Authenticated
 * @query   vehicle_id (optional) - Filter by vehicle ID
 * @query   severity (optional) - Filter by severity (minor, moderate, severe)
 * @query   status (optional) - Filter by TripoSR status
 * @query   from_date (optional) - Filter by date range start
 * @query   to_date (optional) - Filter by date range end
 */
router.get(
  '/',
  damageReportsController.getAllDamageReports.bind(damageReportsController)
);

/**
 * @route   GET /api/damage-reports/pending-3d-generation
 * @desc    Get damage reports pending 3D model generation
 * @access  Authenticated
 */
router.get(
  '/pending-3d-generation',
  damageReportsController.getPending3DGenerations.bind(damageReportsController)
);

/**
 * @route   GET /api/damage-reports/vehicle/:vehicleId
 * @desc    Get damage reports by vehicle ID
 * @access  Authenticated
 * @params  vehicleId - Vehicle ID
 */
router.get(
  '/vehicle/:vehicleId',
  damageReportsController.getDamageReportsByVehicle.bind(damageReportsController)
);

/**
 * @route   GET /api/damage-reports/:id
 * @desc    Get damage report by ID
 * @access  Authenticated
 * @params  id - Damage report ID
 */
router.get(
  '/:id',
  damageReportsController.getDamageReportById.bind(damageReportsController)
);

/**
 * @route   GET /api/damage-reports/:id/detailed
 * @desc    Get detailed damage report by ID (with joins)
 * @access  Authenticated
 * @params  id - Damage report ID
 */
router.get(
  '/:id/detailed',
  damageReportsController.getDetailedDamageReport.bind(damageReportsController)
);

/**
 * @route   GET /api/damage-reports/:id/3d-model-status
 * @desc    Get 3D model generation status for damage report
 * @access  Authenticated
 * @params  id - Damage report ID
 */
router.get(
  '/:id/3d-model-status',
  damageReportsController.get3DModelStatus.bind(damageReportsController)
);

/**
 * @route   POST /api/damage-reports
 * @desc    Create a new damage report
 * @access  Authenticated
 * @body    vehicle_id (required) - Vehicle ID
 * @body    reported_by (required) - User who reported the damage
 * @body    damage_description (required) - Description of the damage
 * @body    damage_severity (required) - Severity: minor, moderate, severe
 * @body    damage_location (optional) - Location of damage on vehicle
 * @body    photos (optional) - Array of photo URLs
 * @body    linked_work_order_id (optional) - Related work order ID
 * @body    inspection_id (optional) - Related inspection ID
 */
router.post(
  '/',
  damageReportsController.createDamageReport.bind(damageReportsController)
);

/**
 * @route   POST /api/damage-reports/:id/generate-3d-model
 * @desc    Generate 3D model for damage report
 * @access  Authenticated
 * @params  id - Damage report ID
 */
router.post(
  '/:id/generate-3d-model',
  damageReportsController.generate3DModel.bind(damageReportsController)
);

/**
 * @route   PATCH /api/damage-reports/:id
 * @desc    Update damage report
 * @access  Authenticated
 * @params  id - Damage report ID
 * @body    damage_description (optional) - Updated description
 * @body    damage_severity (optional) - Updated severity
 * @body    damage_location (optional) - Updated location
 * @body    photos (optional) - Updated photo URLs
 * @body    triposr_status (optional) - Updated TripoSR status
 * @body    triposr_model_url (optional) - Updated model URL
 * @body    linked_work_order_id (optional) - Updated work order ID
 * @body    inspection_id (optional) - Updated inspection ID
 */
router.patch(
  '/:id',
  damageReportsController.updateDamageReport.bind(damageReportsController)
);

/**
 * @route   DELETE /api/damage-reports/:id
 * @desc    Delete damage report
 * @access  Authenticated
 * @params  id - Damage report ID
 */
router.delete(
  '/:id',
  damageReportsController.deleteDamageReport.bind(damageReportsController)
);

export default router;
