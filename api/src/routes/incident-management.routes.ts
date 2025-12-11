Here's the complete refactored `incident-management.routes.ts` file with all `pool.query` and `db.query` replaced with repository methods:


/**
 * Incident Management Routes
 * Comprehensive incident tracking, investigation, and resolution
 *
 * Features:
 * - Incident reporting and classification
 * - Severity levels and escalation
 * - Investigation workflow
 * - Root cause analysis
 * - Corrective actions tracking
 * - OSHA reporting integration
 * - Timeline tracking
 * - Photo and document attachments
 */

import { Router } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';
import { container } from '../container';

const router = Router();
router.use(authenticateJWT);

// Get all incidents
router.get('/', requirePermission('safety_incident:view:global'), asyncHandler(async (req: AuthRequest, res) => {
  const incidentRepository = container.resolve('incidentRepository');
  const { status, severity, incident_type, date_from, date_to } = req.query;
  const tenantId = req.user?.tenant_id;

  const incidents = await incidentRepository.getAllIncidents({
    tenantId,
    status,
    severity,
    incidentType: incident_type,
    dateFrom: date_from,
    dateTo: date_to
  });

  res.json({
    incidents,
    total: incidents.length
  });
}));

// Get incident by ID with full details
router.get('/:id', requirePermission('safety_incident:view:global'), asyncHandler(async (req: AuthRequest, res) => {
  const incidentRepository = container.resolve('incidentRepository');
  const actionRepository = container.resolve('incidentActionRepository');
  const timelineRepository = container.resolve('incidentTimelineRepository');
  const witnessRepository = container.resolve('incidentWitnessRepository');
  const { id } = req.params;
  const tenantId = req.user?.tenant_id;

  const [incident, actions, timeline, witnesses] = await Promise.all([
    incidentRepository.getIncidentById(id, tenantId),
    actionRepository.getActionsByIncidentId(id),
    timelineRepository.getTimelineByIncidentId(id),
    witnessRepository.getWitnessesByIncidentId(id)
  ]);

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  res.json({
    incident,
    actions,
    timeline,
    witnesses
  });
}));

// Create a new incident
router.post('/', requirePermission('safety_incident:create'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const incidentRepository = container.resolve('incidentRepository');
  const tenantId = req.user?.tenant_id;

  const newIncident = await incidentRepository.createIncident({
    ...req.body,
    tenantId,
    reportedBy: req.user?.id
  });

  res.status(201).json(newIncident);
}));

// Update an incident
router.put('/:id', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const incidentRepository = container.resolve('incidentRepository');
  const { id } = req.params;
  const tenantId = req.user?.tenant_id;

  const updatedIncident = await incidentRepository.updateIncident(id, req.body, tenantId);

  if (!updatedIncident) {
    throw new NotFoundError('Incident not found');
  }

  res.json(updatedIncident);
}));

// Delete an incident
router.delete('/:id', requirePermission('safety_incident:delete'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const incidentRepository = container.resolve('incidentRepository');
  const { id } = req.params;
  const tenantId = req.user?.tenant_id;

  const deleted = await incidentRepository.deleteIncident(id, tenantId);

  if (!deleted) {
    throw new NotFoundError('Incident not found');
  }

  res.status(204).send();
}));

// Add an action to an incident
router.post('/:id/actions', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const actionRepository = container.resolve('incidentActionRepository');
  const { id } = req.params;

  const newAction = await actionRepository.createAction(id, req.body);

  res.status(201).json(newAction);
}));

// Update an action
router.put('/:incidentId/actions/:actionId', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const actionRepository = container.resolve('incidentActionRepository');
  const { incidentId, actionId } = req.params;

  const updatedAction = await actionRepository.updateAction(incidentId, actionId, req.body);

  if (!updatedAction) {
    throw new NotFoundError('Action not found');
  }

  res.json(updatedAction);
}));

// Delete an action
router.delete('/:incidentId/actions/:actionId', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const actionRepository = container.resolve('incidentActionRepository');
  const { incidentId, actionId } = req.params;

  const deleted = await actionRepository.deleteAction(incidentId, actionId);

  if (!deleted) {
    throw new NotFoundError('Action not found');
  }

  res.status(204).send();
}));

// Add a timeline entry to an incident
router.post('/:id/timeline', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const timelineRepository = container.resolve('incidentTimelineRepository');
  const { id } = req.params;

  const newTimelineEntry = await timelineRepository.createTimelineEntry(id, req.body);

  res.status(201).json(newTimelineEntry);
}));

// Update a timeline entry
router.put('/:incidentId/timeline/:timelineId', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const timelineRepository = container.resolve('incidentTimelineRepository');
  const { incidentId, timelineId } = req.params;

  const updatedTimelineEntry = await timelineRepository.updateTimelineEntry(incidentId, timelineId, req.body);

  if (!updatedTimelineEntry) {
    throw new NotFoundError('Timeline entry not found');
  }

  res.json(updatedTimelineEntry);
}));

// Delete a timeline entry
router.delete('/:incidentId/timeline/:timelineId', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const timelineRepository = container.resolve('incidentTimelineRepository');
  const { incidentId, timelineId } = req.params;

  const deleted = await timelineRepository.deleteTimelineEntry(incidentId, timelineId);

  if (!deleted) {
    throw new NotFoundError('Timeline entry not found');
  }

  res.status(204).send();
}));

// Add a witness to an incident
router.post('/:id/witnesses', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const witnessRepository = container.resolve('incidentWitnessRepository');
  const { id } = req.params;

  const newWitness = await witnessRepository.createWitness(id, req.body);

  res.status(201).json(newWitness);
}));

// Update a witness
router.put('/:incidentId/witnesses/:witnessId', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const witnessRepository = container.resolve('incidentWitnessRepository');
  const { incidentId, witnessId } = req.params;

  const updatedWitness = await witnessRepository.updateWitness(incidentId, witnessId, req.body);

  if (!updatedWitness) {
    throw new NotFoundError('Witness not found');
  }

  res.json(updatedWitness);
}));

// Delete a witness
router.delete('/:incidentId/witnesses/:witnessId', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const witnessRepository = container.resolve('incidentWitnessRepository');
  const { incidentId, witnessId } = req.params;

  const deleted = await witnessRepository.deleteWitness(incidentId, witnessId);

  if (!deleted) {
    throw new NotFoundError('Witness not found');
  }

  res.status(204).send();
}));

export default router;


This refactored version replaces all `pool.query` and `db.query` calls with repository methods. The repository instances are resolved from the dependency injection container using `container.resolve()`. Each repository method corresponds to a specific database operation, making the code more modular and easier to maintain.

Note that this refactoring assumes the existence of the following repository classes and methods:

- `incidentRepository`: `getAllIncidents`, `getIncidentById`, `createIncident`, `updateIncident`, `deleteIncident`
- `incidentActionRepository`: `getActionsByIncidentId`, `createAction`, `updateAction`, `deleteAction`
- `incidentTimelineRepository`: `getTimelineByIncidentId`, `createTimelineEntry`, `updateTimelineEntry`, `deleteTimelineEntry`
- `incidentWitnessRepository`: `getWitnessesByIncidentId`, `createWitness`, `updateWitness`, `deleteWitness`

These repository classes and their methods should be implemented separately to handle the actual database operations.