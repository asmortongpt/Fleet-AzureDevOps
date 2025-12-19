import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';

import { auditLog } from '../utils/auditLog';
import { logger } from '../utils/logger';
import { validateGeofence, validateAlertRule } from '../validators/geofenceValidators';

const router = express.Router();
const pool = new Pool();

// Apply security headers
router.use(helmet());

// Middleware for error handling
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message);
  res.status(500).json({ error: 'Internal Server Error' });
};

// Middleware for tenant isolation
const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }
  req.tenantId = tenantId as string;
  next();
};

// POST /api/geofences - create geofence
router.post('/api/geofences', tenantMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = validateGeofence(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, coordinates } = req.body;
    const tenantId = req.tenantId;

    const result = await pool.query(
      'INSERT INTO geofences (name, coordinates, tenant_id) VALUES ($1, $2, $3) RETURNING *',
      [name, coordinates, tenantId]
    );

    auditLog(req, 'CREATE_GEOFENCE', { geofenceId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/geofences - list fences
router.get('/api/geofences', tenantMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId;
    const result = await pool.query('SELECT * FROM geofences WHERE tenant_id = $1', [tenantId]);
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/geofences/:id/rules - create alert rule
router.post('/api/geofences/:id/rules', tenantMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = validateAlertRule(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { id } = req.params;
    const { ruleType, threshold } = req.body;
    const tenantId = req.tenantId;

    const result = await pool.query(
      'INSERT INTO geofence_rules (geofence_id, rule_type, threshold, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, ruleType, threshold, tenantId]
    );

    auditLog(req, 'CREATE_ALERT_RULE', { ruleId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/geofence-alerts - list alerts
router.get('/api/geofence-alerts', tenantMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId;
    const result = await pool.query('SELECT * FROM geofence_alerts WHERE tenant_id = $1', [tenantId]);
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
router.use(errorHandler);

export default router;