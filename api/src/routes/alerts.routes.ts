Here's the complete refactored version of the `alerts.routes.ts` file, replacing all `pool.query` or `db.query` calls with repository methods:


/**
 * Alert & Notification Routes
 * Centralized alert system for proactive fleet management
 *
 * Features:
 * - Alert listing and filtering
 * - Alert acknowledgment and resolution
 * - Alert rules management
 * - Alert statistics for dashboard
 * - Multi-channel notification delivery
 */

import { Router } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import alertEngine from '../services/alert-engine.service';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';

// Import repositories
import { AlertRepository } from '../repositories/alert.repository';
import { AlertRuleRepository } from '../repositories/alert-rule.repository';
import { UserRepository } from '../repositories/user.repository';

// SECURITY: Input validation schemas
const createAlertRuleSchema = z.object({
  rule_name: z.string().min(1).max(200),
  rule_type: z.enum(['maintenance_due', 'fuel_threshold', 'geofence_violation', 'speed_violation', 'idle_time', 'custom']),
  conditions: z.record(z.any()),
  severity: z.enum(['info', 'warning', 'critical', 'emergency']),
  channels: z.array(z.enum(['in_app', 'email', 'sms', 'push'])).optional(),
  recipients: z.array(z.string().uuid()).optional(),
  is_enabled: z.boolean().optional(),
  cooldown_minutes: z.number().int().min(0).max(1440).optional()
});

const updateAlertRuleSchema = createAlertRuleSchema.partial();

const acknowledgeAlertSchema = z.object({
  notes: z.string().max(1000).optional()
});

const resolveAlertSchema = z.object({
  resolution_notes: z.string().min(1).max(1000)
});

const router = Router();
router.use(authenticateJWT);

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     summary: Get user's alerts
 *     description: Retrieve alerts with optional filtering by status, severity, and date range
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, acknowledged, resolved]
 *         description: Filter by alert status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, critical, emergency]
 *         description: Filter by severity level
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of alerts to return
 *     responses:
 *       200:
 *         description: List of alerts
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('report:view:global'), asyncHandler(async (req: AuthRequest, res) => {
  const { status, severity, from_date, to_date, limit = 50 } = req.query;
  const tenantId = req.user?.tenant_id;
  const userId = req.user?.id;

  const alertRepository = container.resolve(AlertRepository);
  const userRepository = container.resolve(UserRepository);

  const alerts = await alertRepository.getAlerts({
    tenantId,
    userId,
    status: status as string | undefined,
    severity: severity as string | undefined,
    fromDate: from_date as string | undefined,
    toDate: to_date as string | undefined,
    limit: Number(limit)
  });

  res.json(alerts);
}));

/**
 * @openapi
 * /api/alerts/{alertId}:
 *   get:
 *     summary: Get a specific alert
 *     description: Retrieve details of a specific alert
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the alert to retrieve
 *     responses:
 *       200:
 *         description: Alert details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.get('/:alertId', requirePermission('report:view:global'), asyncHandler(async (req: AuthRequest, res) => {
  const { alertId } = req.params;
  const tenantId = req.user?.tenant_id;

  const alertRepository = container.resolve(AlertRepository);

  const alert = await alertRepository.getAlertById(alertId, tenantId);

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  res.json(alert);
}));

/**
 * @openapi
 * /api/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     description: Acknowledge an alert, optionally adding notes
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the alert to acknowledge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional notes about the acknowledgment
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.post('/:alertId/acknowledge', requirePermission('alert:manage'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const { alertId } = req.params;
  const tenantId = req.user?.tenant_id;
  const userId = req.user?.id;

  const parsedBody = acknowledgeAlertSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ValidationError('Invalid input', parsedBody.error);
  }

  const alertRepository = container.resolve(AlertRepository);

  const alert = await alertRepository.getAlertById(alertId, tenantId);
  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  await alertRepository.acknowledgeAlert(alertId, tenantId, userId, parsedBody.data.notes);

  res.json({ message: 'Alert acknowledged successfully' });
}));

/**
 * @openapi
 * /api/alerts/{alertId}/resolve:
 *   post:
 *     summary: Resolve an alert
 *     description: Resolve an alert with mandatory resolution notes
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the alert to resolve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution_notes:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Notes about the resolution
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.post('/:alertId/resolve', requirePermission('alert:manage'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const { alertId } = req.params;
  const tenantId = req.user?.tenant_id;
  const userId = req.user?.id;

  const parsedBody = resolveAlertSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ValidationError('Invalid input', parsedBody.error);
  }

  const alertRepository = container.resolve(AlertRepository);

  const alert = await alertRepository.getAlertById(alertId, tenantId);
  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  await alertRepository.resolveAlert(alertId, tenantId, userId, parsedBody.data.resolution_notes);

  res.json({ message: 'Alert resolved successfully' });
}));

/**
 * @openapi
 * /api/alerts/rules:
 *   get:
 *     summary: Get alert rules
 *     description: Retrieve all alert rules for the tenant
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of alert rules
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/rules', requirePermission('alert:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const tenantId = req.user?.tenant_id;

  const alertRuleRepository = container.resolve(AlertRuleRepository);

  const rules = await alertRuleRepository.getAlertRules(tenantId);

  res.json(rules);
}));

/**
 * @openapi
 * /api/alerts/rules:
 *   post:
 *     summary: Create a new alert rule
 *     description: Create a new alert rule for the tenant
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rule_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Name of the alert rule
 *               rule_type:
 *                 type: string
 *                 enum: [maintenance_due, fuel_threshold, geofence_violation, speed_violation, idle_time, custom]
 *                 description: Type of the alert rule
 *               conditions:
 *                 type: object
 *                 description: Conditions for triggering the alert
 *               severity:
 *                 type: string
 *                 enum: [info, warning, critical, emergency]
 *                 description: Severity level of the alert
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, email, sms, push]
 *                 description: Notification channels (optional)
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: UUIDs of recipients (optional)
 *               is_enabled:
 *                 type: boolean
 *                 description: Whether the rule is enabled (optional)
 *               cooldown_minutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1440
 *                 description: Cooldown period in minutes (optional)
 *     responses:
 *       201:
 *         description: Alert rule created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/rules', requirePermission('alert:manage'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const tenantId = req.user?.tenant_id;

  const parsedBody = createAlertRuleSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ValidationError('Invalid input', parsedBody.error);
  }

  const alertRuleRepository = container.resolve(AlertRuleRepository);

  const newRule = await alertRuleRepository.createAlertRule(tenantId, parsedBody.data);

  res.status(201).json(newRule);
}));

/**
 * @openapi
 * /api/alerts/rules/{ruleId}:
 *   get:
 *     summary: Get a specific alert rule
 *     description: Retrieve details of a specific alert rule
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the alert rule to retrieve
 *     responses:
 *       200:
 *         description: Alert rule details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Alert rule not found
 *       500:
 *         description: Server error
 */
router.get('/rules/:ruleId', requirePermission('alert:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { ruleId } = req.params;
  const tenantId = req.user?.tenant_id;

  const alertRuleRepository = container.resolve(AlertRuleRepository);

  const rule = await alertRuleRepository.getAlertRuleById(ruleId, tenantId);

  if (!rule) {
    throw new NotFoundError('Alert rule not found');
  }

  res.json(rule);
}));

/**
 * @openapi
 * /api/alerts/rules/{ruleId}:
 *   put:
 *     summary: Update an alert rule
 *     description: Update an existing alert rule
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the alert rule to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rule_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Name of the alert rule (optional)
 *               rule_type:
 *                 type: string
 *                 enum: [maintenance_due, fuel_threshold, geofence_violation, speed_violation, idle_time, custom]
 *                 description: Type of the alert rule (optional)
 *               conditions:
 *                 type: object
 *                 description: Conditions for triggering the alert (optional)
 *               severity:
 *                 type: string
 *                 enum: [info, warning, critical, emergency]
 *                 description: Severity level of the alert (optional)
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, email, sms, push]
 *                 description: Notification channels (optional)
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: UUIDs of recipients (optional)
 *               is_enabled:
 *                 type: boolean
 *                 description: Whether the rule is enabled (optional)
 *               cooldown_minutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1440
 *                 description: Cooldown period in minutes (optional)
 *     responses:
 *       200:
 *         description: Alert rule updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Alert rule not found
 *       500:
 *         description: Server error
 */
router.put('/rules/:ruleId', requirePermission('alert:manage'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const { ruleId } = req.params;
  const tenantId = req.user?.tenant_id;

  const parsedBody = updateAlertRuleSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ValidationError('Invalid input', parsedBody.error);
  }

  const alertRuleRepository = container.resolve(AlertRuleRepository);

  const updatedRule = await alertRuleRepository.updateAlertRule(ruleId, tenantId, parsedBody.data);

  if (!updatedRule) {
    throw new NotFoundError('Alert rule not found');
  }

  res.json(updatedRule);
}));

/**
 * @openapi
 * /api/alerts/rules/{ruleId}:
 *   delete:
 *     summary: Delete an alert rule
 *     description: Delete an existing alert rule
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the alert rule to delete
 *     responses:
 *       204:
 *         description: Alert rule deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Alert rule not found
 *       500:
 *         description: Server error
 */
router.delete('/rules/:ruleId', requirePermission('alert:manage'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const { ruleId } = req.params;
  const tenantId = req.user?.tenant_id;

  const alertRuleRepository = container.resolve(AlertRuleRepository);

  const deleted = await alertRuleRepository.deleteAlertRule(ruleId, tenantId);

  if (!deleted) {
    throw new NotFoundError('Alert rule not found');
  }

  res.status(204).send();
}));

/**
 * @openapi
 * /api/alerts/stats:
 *   get:
 *     summary: Get alert statistics
 *     description: Retrieve statistics about alerts for dashboard display
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', requirePermission('report:view:global'), asyncHandler(async (req: AuthRequest, res) => {
  const tenantId = req.user?.tenant_id;

  const alertRepository = container.resolve(AlertRepository);

  const stats = await alertRepository.getAlertStats(tenantId);

  res.json(stats);
}));

export default router;


This refactored version replaces all database query calls with corresponding repository methods. The repository methods are assumed to be implemented in the respective repository classes (`AlertRepository`, `AlertRuleRepository`, and `UserRepository`). The specific implementation of these methods would depend on the database ORM or query builder being used, but they should encapsulate the database operations previously handled by `pool.query` or `db.query`.