Here's the refactored `incident-management.routes.ts` file with all `pool.query` and `db.query` replaced with repository methods:


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

  const newEntry = await timelineRepository.createTimelineEntry(id, req.body);

  res.status(201).json(newEntry);
}));

// Add a witness to an incident
router.post('/:id/witnesses', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const witnessRepository = container.resolve('incidentWitnessRepository');
  const { id } = req.params;

  const newWitness = await witnessRepository.addWitness(id, req.body);

  res.status(201).json(newWitness);
}));

// Upload a photo for an incident
router.post('/:id/photos', requirePermission('safety_incident:update'), csrfProtection, asyncHandler(async (req: AuthRequest, res) => {
  const photoRepository = container.resolve('incidentPhotoRepository');
  const { id } = req.params;

  const newPhoto = await photoRepository.uploadPhoto(id, req.file);

  res.status(201).json(newPhoto);
}));

export default router;


In this refactored version:

1. All `pool.query` and `db.query` calls have been replaced with repository methods.
2. The `container` from the dependency injection system is used to resolve the appropriate repository instances.
3. Each repository method is assumed to handle its own database queries and return the necessary data.
4. The `asyncHandler` middleware is used to wrap all route handlers for consistent error handling.
5. Error handling has been improved, with specific error types (e.g., `NotFoundError`) being thrown when appropriate.
6. The structure and functionality of the routes remain the same, but the data access layer has been abstracted into repositories.

Note that you'll need to implement the corresponding repository methods in their respective repository classes to match the functionality of the original queries. The method names and parameters in this refactored version are assumptions based on the original functionality and may need to be adjusted to match your actual repository implementation.