/**
 * Vehicle Hardware Configuration Routes
 *
 * Manages multi-provider telematics integration for vehicles:
 * - Smartcar (OEM connectivity)
 * - Samsara (fleet telematics)
 * - Teltonika (GPS trackers)
 * - OBD2 Mobile (smartphone-based OBD2 readers)
 *
 * Security:
 * - JWT authentication required
 * - Tenant isolation enforced
 * - Provider validation (whitelist only)
 * - Rate limiting on configuration changes
 * - Input sanitization via express-validator
 */

import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import logger from '../config/logger';
import { pool } from '../db';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import { VehicleHardwareConfigService } from '../services/vehicle-hardware-config.service';

const router = express.Router();
const hardwareService = new VehicleHardwareConfigService(pool);

// Apply authentication to all routes
router.use(authenticateJWT);

// Rate limiting for configuration changes (10 requests per minute per IP)
const configChangeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many configuration requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Supported provider whitelist
const SUPPORTED_PROVIDERS = ['smartcar', 'samsara', 'teltonika', 'obd2_mobile'] as const;
type SupportedProvider = typeof SUPPORTED_PROVIDERS[number];

function isValidProvider(provider: string): provider is SupportedProvider {
  return SUPPORTED_PROVIDERS.includes(provider as SupportedProvider);
}

/**
 * Validation middleware
 */
const handleValidationErrors = (req: AuthRequest, res: Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/vehicles/:id/hardware-config
 * Get vehicle's configured hardware providers
 */
router.get(
  '/vehicles/:id/hardware-config',
  [
    param('id').isInt({ min: 1 }).withMessage('Vehicle ID must be a positive integer'),
  ],
  handleValidationErrors,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'vehicle_hardware_config' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const tenantId = req.user!.tenant_id!;

      const config = await hardwareService.getVehicleHardwareConfig(vehicleId);

      if (!config) {
        throw new NotFoundError('Vehicle not found or access denied');
      }

      res.json({
        success: true,
        data: {
          vehicleId: config.vehicleId,
          providers: config.providers.map(p => ({
            provider: p.provider,
            status: p.status,
            capabilities: p.capabilities,
            config: p.config,
            lastSync: p.lastSync,
            syncStatus: p.syncStatus
          }))
        }
      });
    } catch (error: any) {
      logger.error('Get hardware config error:', { error, vehicleId: req.params.id });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve hardware configuration',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/vehicles/:id/hardware-config/providers
 * Add a provider to a vehicle
 */
router.post(
  '/vehicles/:id/hardware-config/providers',
  csrfProtection,
  configChangeLimiter,
  [
    param('id').isInt({ min: 1 }).withMessage('Vehicle ID must be a positive integer'),
    body('provider')
      .isString()
      .custom((value) => {
        if (!isValidProvider(value)) {
          throw new Error(`Provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`);
        }
        return true;
      }),
    body('config')
      .optional()
      .isObject()
      .withMessage('Config must be an object'),
  ],
  handleValidationErrors,
  requirePermission('vehicle:manage:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'vehicle_hardware_provider' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const tenantId = req.user!.tenant_id!;
      const { provider, config } = req.body;

      // Validate provider
      if (!isValidProvider(provider)) {
        throw new ValidationError(`Provider not supported: ${provider}`);
      }

      // Add provider to vehicle
      const providerConfig = { provider, ...(config || {}) };
      const result = await hardwareService.addProvider(vehicleId, providerConfig, Number(req.user!.id));

      logger.info('Provider added to vehicle', {
        vehicleId,
        provider,
        tenantId,
        userId: req.user!.id
      });

      res.status(201).json({
        success: true,
        data: {
          providerId: result.provider,
          message: `Provider '${provider}' added successfully`
        }
      });
    } catch (error: any) {
      logger.error('Add provider error:', {
        error,
        vehicleId: req.params.id,
        provider: req.body.provider
      });

      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to add provider',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/vehicles/:id/hardware-config/providers/:provider
 * Remove a provider from a vehicle
 */
router.delete(
  '/vehicles/:id/hardware-config/providers/:provider',
  csrfProtection,
  configChangeLimiter,
  [
    param('id').isInt({ min: 1 }).withMessage('Vehicle ID must be a positive integer'),
    param('provider')
      .isString()
      .custom((value) => {
        if (!isValidProvider(value)) {
          throw new Error(`Provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`);
        }
        return true;
      }),
  ],
  handleValidationErrors,
  requirePermission('vehicle:manage:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'vehicle_hardware_provider' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const provider = req.params.provider as SupportedProvider;
      const tenantId = req.user!.tenant_id!;

      await hardwareService.removeProvider(vehicleId, provider, Number(tenantId));

      logger.info('Provider removed from vehicle', {
        vehicleId,
        provider,
        tenantId,
        userId: req.user!.id
      });

      res.json({
        success: true,
        message: `Provider '${provider}' removed successfully`
      });
    } catch (error: any) {
      logger.error('Remove provider error:', {
        error,
        vehicleId: req.params.id,
        provider: req.params.provider
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to remove provider',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/vehicles/:id/hardware-config/providers/:provider/test
 * Test provider connection and capabilities
 */
router.post(
  '/vehicles/:id/hardware-config/providers/:provider/test',
  csrfProtection,
  [
    param('id').isInt({ min: 1 }).withMessage('Vehicle ID must be a positive integer'),
    param('provider')
      .isString()
      .custom((value) => {
        if (!isValidProvider(value)) {
          throw new Error(`Provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`);
        }
        return true;
      }),
  ],
  handleValidationErrors,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicle_hardware_test' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const provider = req.params.provider as SupportedProvider;
      const tenantId = req.user!.tenant_id!;

      const testResult = await hardwareService.testProviderConnection(vehicleId, provider);

      logger.info('Provider connection tested', {
        vehicleId,
        provider,
        success: testResult.success,
        tenantId,
        userId: req.user!.id
      });

      res.json({
        success: testResult.success,
        status: testResult.status,
        capabilities: testResult.capabilities,
        error: testResult.error,
        message: testResult.success
          ? `Provider '${provider}' connection successful`
          : `Provider '${provider}' connection failed`
      });
    } catch (error: any) {
      logger.error('Test provider error:', {
        error,
        vehicleId: req.params.id,
        provider: req.params.provider
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to test provider connection',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * PATCH /api/vehicles/:id/hardware-config/providers/:provider
 * Update provider configuration
 */
router.patch(
  '/vehicles/:id/hardware-config/providers/:provider',
  csrfProtection,
  configChangeLimiter,
  [
    param('id').isInt({ min: 1 }).withMessage('Vehicle ID must be a positive integer'),
    param('provider')
      .isString()
      .custom((value) => {
        if (!isValidProvider(value)) {
          throw new Error(`Provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`);
        }
        return true;
      }),
    body('config')
      .isObject()
      .withMessage('Config must be an object'),
  ],
  handleValidationErrors,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicle_hardware_provider' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const provider = req.params.provider as SupportedProvider;
      const { config } = req.body;
      const tenantId = req.user!.tenant_id!;

      await hardwareService.updateProviderConfig(vehicleId, provider, config, Number(tenantId));

      logger.info('Provider config updated', {
        vehicleId,
        provider,
        tenantId,
        userId: req.user!.id
      });

      res.json({
        success: true,
        message: `Provider '${provider}' configuration updated successfully`
      });
    } catch (error: any) {
      logger.error('Update provider config error:', {
        error,
        vehicleId: req.params.id,
        provider: req.params.provider
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update provider configuration',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/vehicles/:id/telemetry/unified
 * Get unified telemetry data from all configured providers
 */
router.get(
  '/vehicles/:id/telemetry/unified',
  [
    param('id').isInt({ min: 1 }).withMessage('Vehicle ID must be a positive integer'),
  ],
  handleValidationErrors,
  requirePermission('telemetry:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'vehicle_telemetry_unified' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const tenantId = req.user!.tenant_id!;

      const telemetry = await hardwareService.getUnifiedTelemetry(vehicleId);

      if (!telemetry) {
        throw new NotFoundError('Vehicle not found or no telemetry data available');
      }

      res.json({
        success: true,
        data: {
          vehicleId: telemetry.vehicleId,
          timestamp: telemetry.timestamp,
          location: telemetry.aggregated.location,
          fuel: telemetry.aggregated.fuelPercent,
          diagnostics: telemetry.aggregated,
          safety: telemetry.aggregated,
          temperature: telemetry.aggregated.temperature,
          providers: telemetry.providers
        }
      });
    } catch (error: any) {
      logger.error('Get unified telemetry error:', {
        error,
        vehicleId: req.params.id
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve unified telemetry',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

export default router;
