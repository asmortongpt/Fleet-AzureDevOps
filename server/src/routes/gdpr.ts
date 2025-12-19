import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

import { GDPRService } from '../services/gdpr.service';
import { logger } from '../services/logger';

const router = Router();

// TODO: Replace with actual database pool from DI container
// For now, we'll create a simple pool (should be injected)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'fleet_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const gdprService = new GDPRService(pool);

/**
 * GET /api/gdpr/export
 *
 * GDPR Right to Access - Export all user data
 *
 * Returns comprehensive data package in JSON format
 */
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Get user ID from authenticated session
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - user ID not found in session',
      });
      return;
    }

    const exportData = await gdprService.exportUserData(userId);

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename=gdpr-export-user-${userId}.json`);
    res.setHeader('Content-Type', 'application/json');

    res.json({
      success: true,
      message: 'GDPR data export successful',
      data: exportData,
      exportedAt: new Date().toISOString(),
      gdprNotice:
        'This data is provided under GDPR Article 15 (Right to Access). You may request corrections or deletion.',
    });
  } catch (error) {
    logger.error('GDPR export failed', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      error: 'Failed to export user data',
    });
  }
});

/**
 * POST /api/gdpr/delete
 *
 * GDPR Right to Erasure - "Right to be forgotten"
 *
 * Permanently deletes or anonymizes all user personal data
 * (Keeps audit logs and vehicle data for legal/regulatory compliance)
 */
router.post('/delete', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - user ID not found in session',
      });
      return;
    }

    const { confirmationCode } = req.body;

    // Require explicit confirmation
    if (confirmationCode !== 'DELETE_MY_DATA') {
      res.status(400).json({
        success: false,
        error: 'Invalid confirmation code. Send { "confirmationCode": "DELETE_MY_DATA" }',
      });
      return;
    }

    await gdprService.eraseUserData(userId, 'user_request');

    // Invalidate session after deletion
    // TODO: Implement session invalidation
    // await sessionService.invalidateAllUserSessions(userId);

    logger.warn('GDPR user data deleted', { userId });

    res.json({
      success: true,
      message: 'Your personal data has been deleted as per GDPR Article 17.',
      deletionDate: new Date().toISOString(),
      notice:
        'Audit logs and vehicle data are retained for legal compliance but are no longer linked to your identity.',
    });
  } catch (error) {
    logger.error('GDPR deletion failed', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete user data',
    });
  }
});

/**
 * GET /api/gdpr/retention-policy
 *
 * Get data retention policy information
 */
router.get('/retention-policy', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    policies: {
      userPersonalData: '90 days after account closure',
      vehicleTelemetry: '7 years (regulatory requirement)',
      auditLogs: '10 years (SOC 2 compliance)',
      sessionData: '30 days',
      financialRecords: '7 years (tax/audit)',
      driverRecords: '7 years',
      inactiveAccounts: '1 year of inactivity triggers deletion warning',
    },
    gdprRights: {
      rightToAccess: 'Request your data via GET /api/gdpr/export',
      rightToErasure: 'Delete your data via POST /api/gdpr/delete',
      rightToRectification: 'Update your profile via PUT /api/users/profile',
      rightToPortability: 'Export in machine-readable format via GET /api/gdpr/export',
    },
    contact: 'gdpr-compliance@capitaltechalliance.com',
  });
});

/**
 * POST /api/gdpr/cleanup (Admin Only)
 *
 * Manually trigger data retention cleanup
 */
router.post('/cleanup', async (_req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Add admin authorization check
    // if (!req.user?.role === 'admin') { return res.status(403).json(...); }

    const results = await gdprService.cleanupExpiredData();

    logger.info('Manual GDPR cleanup executed', results);

    res.json({
      success: true,
      message: 'Data retention cleanup completed',
      results,
    });
  } catch (error) {
    logger.error('GDPR cleanup failed', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      error: 'Failed to execute cleanup',
    });
  }
});

export default router;
