import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import { PartsService } from '../services/parts.service';
import { asyncHandler } from '../utils/async-handler';

const router = express.Router();

router.use(helmet());
router.use(express.json());
router.use(csurf({ cookie: true }));
router.use(authenticateJWT);
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));

const partsService = new PartsService();

/**
 * Part Scan Schema
 */
const PartScanSchema = z.object({
  barcode: z.string().min(1),
});

router.post('/parts/scan', requirePermission('inventory:view:global'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const validated = PartScanSchema.parse(req.body);
    const tenantId = req.user.tenant_id;

    const part = await partsService.lookupPartByBarcode(validated.barcode, tenantId);

    if (!part) {
      return res.status(404).json({
        error: 'Part not found',
        barcode: validated.barcode,
      });
    }

    auditLog(req, 'Part scanned', { barcode: validated.barcode });
    res.json({ part });
  } catch (error) {
    console.error('Error scanning part:', error);
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

/**
 * Part Search Schema
 */
const PartSearchSchema = z.object({
  q: z.string().min(1),
});

router.get('/parts/search', requirePermission('inventory:search:global'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const validated = PartSearchSchema.parse({ q: req.query.q });
    const tenantId = req.user.tenant_id;

    const parts = await partsService.searchParts(validated.q, tenantId);

    if (parts.length === 0) {
      return res.status(404).json({
        error: 'No parts found',
        query: validated.q,
      });
    }

    auditLog(req, 'Parts searched', { query: validated.q });
    res.json({ parts });
  } catch (error) {
    console.error('Error searching parts:', error);
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

export default router;