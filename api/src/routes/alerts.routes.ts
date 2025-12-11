To refactor the provided `alerts.routes.ts` file, we need to eliminate all direct database queries and replace them with repository methods. Below is the complete refactored version of the file, adhering to the specified requirements and rules:


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
 *                 additionalProperties: true
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
 *                 description: Notification channels for the alert
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: UUIDs of recipients for the alert
 *               is_enabled:
 *                 type: boolean
 *                 description: Whether the rule is enabled
 *               cooldown_minutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1440
 *                 description: Cooldown period in minutes
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
 *     description: Update an existing alert rule for the tenant
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
 *                 description: Name of the alert rule
 *               rule_type:
 *                 type: string
 *                 enum: [maintenance_due, fuel_threshold, geofence_violation, speed_violation, idle_time, custom]
 *                 description: Type of the alert rule
 *               conditions:
 *                 type: object
 *                 additionalProperties: true
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
 *                 description: Notification channels for the alert
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: UUIDs of recipients for the alert
 *               is_enabled:
 *                 type: boolean
 *                 description: Whether the rule is enabled
 *               cooldown_minutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1440
 *                 description: Cooldown period in minutes
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

  const rule = await alertRuleRepository.getAlertRuleById(ruleId, tenantId);
  if (!rule) {
    throw new NotFoundError('Alert rule not found');
  }

  const updatedRule = await alertRuleRepository.updateAlertRule(ruleId, tenantId, parsedBody.data);

  res.json(updatedRule);
}));

/**
 * @openapi
 * /api/alerts/rules/{ruleId}:
 *   delete:
 *     summary: Delete an alert rule
 *     description: Delete an existing alert rule for the tenant
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
 *       200:
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

  await alertRuleRepository.deleteAlertRule(ruleId, tenantId);

  res.json({ message: 'Alert rule deleted successfully' });
}));

export default router;


### Repository Methods

To support the refactored code, the following repository methods need to be implemented in their respective repository classes:

#### AlertRepository


class AlertRepository {
  async getAlerts(params: {
    tenantId: string;
    userId: string;
    status?: string;
    severity?: string;
    fromDate?: string;
    toDate?: string;
    limit: number;
  }): Promise<Alert[]> {
    // Implementation to fetch alerts based on the given parameters
  }

  async getAlertById(alertId: string, tenantId: string): Promise<Alert | null> {
    // Implementation to fetch a specific alert by ID and tenant
  }

  async acknowledgeAlert(alertId: string, tenantId: string, userId: string, notes?: string): Promise<void> {
    // Implementation to acknowledge an alert
  }

  async resolveAlert(alertId: string, tenantId: string, userId: string, resolutionNotes: string): Promise<void> {
    // Implementation to resolve an alert
  }
}


#### AlertRuleRepository


class AlertRuleRepository {
  async getAlertRules(tenantId: string): Promise<AlertRule[]> {
    // Implementation to fetch all alert rules for a tenant
  }

  async getAlertRuleById(ruleId: string, tenantId: string): Promise<AlertRule | null> {
    // Implementation to fetch a specific alert rule by ID and tenant
  }

  async createAlertRule(tenantId: string, ruleData: any): Promise<AlertRule> {
    // Implementation to create a new alert rule
  }

  async updateAlertRule(ruleId: string, tenantId: string, ruleData: any): Promise<AlertRule> {
    // Implementation to update an existing alert rule
  }

  async deleteAlertRule(ruleId: string, tenantId: string): Promise<void> {
    // Implementation to delete an alert rule
  }
}


### Notes on Refactoring

1. **Complex Aggregations**: The `getAlerts` method in `AlertRepository` might involve complex aggregations. Ensure that the repository method is optimized for performance, possibly using indexed queries.

2. **Joins**: If the `getAlerts` method requires joining multiple tables, consider implementing separate repository calls and merging the results in the repository method itself.

3. **Transactions**: For operations like `acknowledgeAlert` and `resolveAlert`, ensure that the repository methods use transaction wrappers to maintain data integrity.

4. **Real-time Queries**: If real-time data is required, consider using indexed queries in the repository methods to maintain performance.

5. **Legacy Compatibility**: If there are legacy systems involved, create a compatibility layer within the repository to handle any necessary transformations or mappings.

6. **Error Handling**: Ensure that all repository methods handle errors robustly and throw appropriate exceptions that can be caught and processed in the route handlers.

By following these guidelines, the refactored code maintains all business logic, eliminates direct database queries, and adheres to the specified requirements and rules.