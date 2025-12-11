/**
 * Crash Detection API Routes
 *
 * Handles crash reports from mobile devices and triggers emergency response
 */

import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { CrashIncidentRepository } from '../repositories/crash-incident.repository';
import { EmergencyResponseService } from '../services/emergency-response.service';

const router = express.Router();

// Import repositories
const crashIncidentRepository = new CrashIncidentRepository();

/**
 * Crash Report Schema
 */
const CrashReportSchema = z.object({
  timestamp: z.string().datetime(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxAcceleration: z.number(),
  userCanceled: z.boolean(),
  telemetry: z.record(z.any()).optional()
});

/**
 * @swagger
 * /api/v1/incidents/crash:
 *   post:
 *     summary: Report a detected crash
 *     description: Submit crash detection data from mobile device
 *     tags: [Crash Detection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timestamp
 *               - maxAcceleration
 *               - userCanceled
 *             properties:
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               maxAcceleration:
 *                 type: number
 *                 description: Maximum G-force detected
 *               userCanceled:
 *                 type: boolean
 *                 description: Whether user canceled the emergency response
 *               telemetry:
 *                 type: object
 *                 description: Additional telemetry data
 *     responses:
 *       201:
 *         description: Crash report saved successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/crash',
  csrfProtection,
  auditLog('crash_report_submitted'),
  async (req: Request, res: Response) => {
    try {
      const validated = CrashReportSchema.parse(req.body);
      const user = (req as any).user;
      const tenantId = user.tenant_id;
      const userId = user.id;

      // Check if this is a real emergency (not canceled)
      const isEmergency = !validated.userCanceled;

      // Insert crash incident
      const incident = await crashIncidentRepository.createCrashIncident({
        tenantId,
        userId,
        driverId: userId, // Assuming the user is also the driver
        timestamp: validated.timestamp,
        latitude: validated.latitude,
        longitude: validated.longitude,
        maxAcceleration: validated.maxAcceleration,
        userCanceled: validated.userCanceled,
        telemetryData: JSON.stringify(validated.telemetry || {}),
        emergencyServicesNotified: isEmergency
      });

      // If not canceled, trigger emergency response
      if (isEmergency) {
        await EmergencyResponseService.triggerEmergencyResponse(incident);
      }

      // Log the incident
      console.log(`[CrashDetection] Crash incident reported by user ${userId}`, {
        incidentId: incident.id,
        acceleration: validated.maxAcceleration,
        userCanceled: validated.userCanceled,
        location: validated.latitude && validated.longitude ? `${validated.latitude}, ${validated.longitude}` : 'Unknown'
      });

      res.status(201).json({ message: 'Crash report submitted successfully', incidentId: incident.id });
    } catch (error) {
      console.error('[CrashDetection] Error processing crash report:', error);
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
);

/**
 * @swagger
 * /api/v1/incidents/crash/{incidentId}:
 *   get:
 *     summary: Retrieve a specific crash incident
 *     description: Get details of a specific crash incident
 *     tags: [Crash Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the crash incident
 *     responses:
 *       200:
 *         description: Crash incident details
 *       404:
 *         description: Crash incident not found
 */
router.get('/crash/:incidentId',
  authenticateJWT,
  csrfProtection,
  async (req: Request, res: Response) => {
    try {
      const incidentId = req.params.incidentId;
      const user = (req as any).user;
      const tenantId = user.tenant_id;

      // Retrieve crash incident
      const incident = await crashIncidentRepository.getCrashIncidentById(incidentId, tenantId);

      if (!incident) {
        return res.status(404).json({ error: 'Crash incident not found' });
      }

      res.json(incident);
    } catch (error) {
      console.error('[CrashDetection] Error retrieving crash incident:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;