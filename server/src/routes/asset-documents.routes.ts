import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import helmet from 'helmet';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

import { authenticateTenant } from '../middleware/authenticateTenant';
import { auditLog } from '../utils/auditLog';
import { logger } from '../utils/logger';

const router = express.Router();
const pool = new Pool(); // Assume pool is configured with environment variables

// Security headers
router.use(helmet());

// Middleware to ensure HTTPS
router.use((req, res, next) => {
  if (req.secure) {
    next();
  } else {
    res.redirect(`https://${req.headers.host}${req.url}`);
  }
});

// POST /api/assets/:assetId/documents - upload document
router.post('/api/assets/:assetId/documents', [
  authenticateTenant,
  check('assetId').isUUID(),
  check('document').isString().isLength({ min: 1 })
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('Validation failed', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }

  const { assetId } = req.params;
  const { document } = req.body;
  const tenantId = req.tenantId;

  try {
    const documentId = uuidv4();
    await pool.query(
      'INSERT INTO documents (id, asset_id, tenant_id, content) VALUES ($1, $2, $3, $4)',
      [documentId, assetId, tenantId, document]
    );

    auditLog('Document uploaded', { assetId, documentId, tenantId });
    res.status(201).json({ documentId });
  } catch (error) {
    logger.error('Error uploading document', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/assets/:assetId/documents - list documents
router.get('/api/assets/:assetId/documents', [
  authenticateTenant,
  check('assetId').isUUID()
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('Validation failed', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }

  const { assetId } = req.params;
  const tenantId = req.tenantId;

  try {
    const result = await pool.query(
      'SELECT id, content FROM documents WHERE asset_id = $1 AND tenant_id = $2',
      [assetId, tenantId]
    );

    auditLog('Documents listed', { assetId, tenantId });
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Error listing documents', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/documents/expiring - compliance dashboard
router.get('/api/documents/expiring', authenticateTenant, async (req: Request, res: Response) => {
  const tenantId = req.tenantId;

  try {
    const result = await pool.query(
      `SELECT id, asset_id, content, expiration_date 
       FROM documents 
       WHERE expiration_date < NOW() + INTERVAL '30 days' AND tenant_id = $1`,
      [tenantId]
    );

    auditLog('Expiring documents retrieved', { tenantId });
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Error retrieving expiring documents', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;