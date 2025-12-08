import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';

import { logError, logAudit } from './logger';
import { ensureAuthenticated, getTenantId } from './middleware';
import { validateSessionCreation, validateEventRecording, validateSessionClosure, validateTagLookup } from './validators';

const router = express.Router();
const pool = new Pool();

// Security headers
router.use(helmet());

// Ensure HTTPS
router.use((req, res, next) => {
  if (req.secure) {
    next();
  } else {
    res.status(403).send('HTTPS Required');
  }
});

// Create scan session
router.post('/api/scan/sessions', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { error } = validateSessionCreation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { userId, assetId } = req.body;
    const result = await pool.query(
      'INSERT INTO scan_sessions (tenant_id, user_id, asset_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [tenantId, userId, assetId]
    );

    logAudit('Scan session created', { tenantId, userId, assetId });
    res.status(201).send({ sessionId: result.rows[0].id });
  } catch (err) {
    logError(err);
    res.status(500).send('Internal Server Error');
  }
});

// Record scan event
router.post('/api/scan/sessions/:id/events', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { error } = validateEventRecording(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { id } = req.params;
    const { eventType, eventData } = req.body;
    await pool.query(
      'INSERT INTO scan_events (tenant_id, session_id, event_type, event_data, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [tenantId, id, eventType, eventData]
    );

    logAudit('Scan event recorded', { tenantId, sessionId: id, eventType });
    res.status(201).send('Event recorded');
  } catch (err) {
    logError(err);
    res.status(500).send('Internal Server Error');
  }
});

// Close scan session
router.post('/api/scan/sessions/:id/close', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { error } = validateSessionClosure(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { id } = req.params;
    await pool.query(
      'UPDATE scan_sessions SET closed_at = NOW() WHERE tenant_id = $1 AND id = $2 AND closed_at IS NULL',
      [tenantId, id]
    );

    logAudit('Scan session closed', { tenantId, sessionId: id });
    res.status(200).send('Session closed');
  } catch (err) {
    logError(err);
    res.status(500).send('Internal Server Error');
  }
});

// Lookup asset by tag
router.get('/api/assets/byTag/:tag', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { error } = validateTagLookup(req.params);
    if (error) return res.status(400).send(error.details[0].message);

    const { tag } = req.params;
    const result = await pool.query(
      'SELECT * FROM assets WHERE tenant_id = $1 AND tag = $2',
      [tenantId, tag]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Asset not found');
    }

    logAudit('Asset lookup by tag', { tenantId, tag });
    res.status(200).send(result.rows[0]);
  } catch (err) {
    logError(err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;