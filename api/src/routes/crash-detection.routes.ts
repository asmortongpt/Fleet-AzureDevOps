To refactor the `crash-detection.routes.ts` file to use the repository pattern, we'll need to create a repository for crash incidents and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


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

      res.status(201).json({ message: 'Crash report saved successfully', incidentId: incident.id });
    } catch (error) {
      console.error('[CrashDetection] Error processing crash report:', error);
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
);

// Apply authentication to all routes
router.use(authenticateJWT);

export default router;


In this refactored version:

1. We've imported the `CrashIncidentRepository` and created an instance of it at the top of the file.

2. We've replaced the `pool.query` call with a call to the `createCrashIncident` method of the `CrashIncidentRepository`. This method is assumed to handle the database insertion and return the created incident.

3. We've removed the `client` connection management, as it's now handled by the repository.

4. We've assumed the existence of an `EmergencyResponseService` that handles triggering the emergency response. This service would likely use a repository to log the response.

5. We've kept all the route handlers and middleware as they were in the original code.

6. We've added error handling to catch and log any errors that occur during the process.

Note that you'll need to implement the `CrashIncidentRepository` and `EmergencyResponseService` classes separately. The `CrashIncidentRepository` should have a `createCrashIncident` method that performs the database insertion and returns the created incident. The `EmergencyResponseService` should have a `triggerEmergencyResponse` method that handles the emergency response logic.

This refactored version adheres to the repository pattern, separating the data access logic from the route handlers and making the code more modular and easier to maintain.