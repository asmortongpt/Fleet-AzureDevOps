To refactor the `alerts.routes.ts` file to use the repository pattern, we'll need to replace all `pool.query` or `db.query` calls with repository methods. We'll import the necessary repositories at the top of the file and modify the route handlers to use these repositories. Here's the refactored version of the file:


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
    status,
    severity,
    fromDate: from_date as string | undefined,
    toDate: to_date as string | undefined,
    limit: parseInt(limit as string, 10)
  });

  const alertsWithUserNames = await Promise.all(alerts.map(async (alert) => {
    const acknowledgedByUser = alert.acknowledged_by ? await userRepository.getUserById(alert.acknowledged_by) : null;
    const resolvedByUser = alert.resolved_by ? await userRepository.getUserById(alert.resolved_by) : null;

    return {
      ...alert,
      acknowledged_by_name: acknowledgedByUser ? `${acknowledgedByUser.first_name} ${acknowledgedByUser.last_name}` : null,
      resolved_by_name: resolvedByUser ? `${resolvedByUser.first_name} ${resolvedByUser.last_name}` : null
    };
  }));

  res.json(alertsWithUserNames);
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
  const userRepository = container.resolve(UserRepository);

  const alert = await alertRepository.getAlertById(alertId, tenantId);

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  const acknowledgedByUser = alert.acknowledged_by ? await userRepository.getUserById(alert.acknowledged_by) : null;
  const resolvedByUser = alert.resolved_by ? await userRepository.getUserById(alert.resolved_by) : null;

  const alertWithUserNames = {
    ...alert,
    acknowledged_by_name: acknowledgedByUser ? `${acknowledgedByUser.first_name} ${acknowledgedByUser.last_name}` : null,
    resolved_by_name: resolvedByUser ? `${resolvedByUser.first_name} ${resolvedByUser.last_name}` : null
  };

  res.json(alertWithUserNames);
}));

/**
 * @openapi
 * /api/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     description: Acknowledge an alert and add optional notes
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
 *                 description: Optional notes for acknowledgment
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
router.post('/:alertId/acknowledge', requirePermission('alert:acknowledge'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const { alertId } = req.params;
  const { notes } = acknowledgeAlertSchema.parse(req.body);
  const userId = req.user?.id;
  const tenantId = req.user?.tenant_id;

  const alertRepository = container.resolve(AlertRepository);

  const alert = await alertRepository.getAlertById(alertId, tenantId);

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  if (alert.status !== 'pending' && alert.status !== 'sent') {
    throw new ValidationError('Alert cannot be acknowledged in its current state');
  }

  await alertRepository.acknowledgeAlert(alertId, userId, notes);

  res.json({ message: 'Alert acknowledged successfully' });
}));

/**
 * @openapi
 * /api/alerts/{alertId}/resolve:
 *   post:
 *     summary: Resolve an alert
 *     description: Resolve an alert and add resolution notes
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
 *                 description: Notes for resolution
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
router.post('/:alertId/resolve', requirePermission('alert:resolve'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const { alertId } = req.params;
  const { resolution_notes } = resolveAlertSchema.parse(req.body);
  const userId = req.user?.id;
  const tenantId = req.user?.tenant_id;

  const alertRepository = container.resolve(AlertRepository);

  const alert = await alertRepository.getAlertById(alertId, tenantId);

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  if (alert.status !== 'acknowledged') {
    throw new ValidationError('Alert cannot be resolved in its current state');
  }

  await alertRepository.resolveAlert(alertId, userId, resolution_notes);

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
 *               rule_type:
 *                 type: string
 *                 enum: [maintenance_due, fuel_threshold, geofence_violation, speed_violation, idle_time, custom]
 *               conditions:
 *                 type: object
 *               severity:
 *                 type: string
 *                 enum: [info, warning, critical, emergency]
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, email, sms, push]
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               is_enabled:
 *                 type: boolean
 *               cooldown_minutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1440
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
  const { rule_name, rule_type, conditions, severity, channels, recipients, is_enabled, cooldown_minutes } = createAlertRuleSchema.parse(req.body);
  const tenantId = req.user?.tenant_id;

  const alertRuleRepository = container.resolve(AlertRuleRepository);

  const newRule = await alertRuleRepository.createAlertRule({
    tenantId,
    rule_name,
    rule_type,
    conditions,
    severity,
    channels,
    recipients,
    is_enabled,
    cooldown_minutes
  });

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
 *               rule_type:
 *                 type: string
 *                 enum: [maintenance_due, fuel_threshold, geofence_violation, speed_violation, idle_time, custom]
 *               conditions:
 *                 type: object
 *               severity:
 *                 type: string
 *                 enum: [info, warning, critical, emergency]
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, email, sms, push]
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               is_enabled:
 *                 type: boolean
 *               cooldown_minutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1440
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
  const { rule_name, rule_type, conditions, severity, channels, recipients, is_enabled, cooldown_minutes } = updateAlertRuleSchema.parse(req.body);
  const tenantId = req.user?.tenant_id;

  const alertRuleRepository = container.resolve(AlertRuleRepository);

  const rule = await alertRuleRepository.getAlertRuleById(ruleId, tenantId);

  if (!rule) {
    throw new NotFoundError('Alert rule not found');
  }

  const updatedRule = await alertRuleRepository.updateAlertRule(ruleId, {
    rule_name,
    rule_type,
    conditions,
    severity,
    channels,
    recipients,
    is_enabled,
    cooldown_minutes
  });

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

  const rule = await alertRuleRepository.getAlertRuleById(ruleId, tenantId);

  if (!rule) {
    throw new NotFoundError('Alert rule not found');
  }

  await alertRuleRepository.deleteAlertRule(ruleId);

  res.status(204).send();
}));

/**
 * @openapi
 * /api/alerts/stats:
 *   get:
 *     summary: Get alert statistics
 *     description: Retrieve alert statistics for dashboard
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

/**
 * @openapi
 * /api/alerts/trigger:
 *   post:
 *     summary: Manually trigger an alert
 *     description: Manually trigger an alert for testing or special cases
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alert_type:
 *                 type: string
 *                 description: Type of alert to trigger
 *               data:
 *                 type: object
 *                 description: Additional data for the alert
 *     responses:
 *       200:
 *         description: Alert triggered successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/trigger', requirePermission('alert:manage'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const { alert_type, data } = req.body;
  const tenantId = req.user?.tenant_id;

  const alert = await alertEngine.triggerAlert(alert_type, data, tenantId);

  res.json({ message: 'Alert triggered successfully', alertId: alert.id });
}));

export default router;


In this refactored version:

1. We've imported the necessary repositories at the top of the file:
   
   import { AlertRepository } from '../repositories/alert.repository';
   import { AlertRuleRepository } from '../repositories/alert-rule.repository';
   import { UserRepository } from '../repositories/user.repository';
   

2. We've replaced all `pool.query` or `db.query` calls with repository methods. For example:
   - `alertRepository.getAlerts()` instead of a query to fetch alerts
   - `alertRepository.getAlertById()` instead of a query to fetch a specific alert
   - `alertRepository.acknowledgeAlert()` instead of a query to acknowledge an alert
   - `alertRuleRepository.getAlertRules()` instead of a query to fetch alert rules
   - `alertRuleRepository.createAlertRule()` instead of a query to create a new alert rule

3. We've kept all the route handlers as requested, but modified them to use the repository methods.

4. We've used the `container.resolve()` method to get instances of the repositories, assuming that the repositories are registered in the container.

5. We've added error handling using the `asyncHandler` middleware, which was already imported in the original file.

6. We've kept the OpenAPI documentation for each route.

Note that this refactoring assumes the existence of `AlertRepository`, `AlertRuleRepository`, and `UserRepository` classes with the appropriate methods. You may need to create or modify these repository classes to match the methods used in this refactored code.