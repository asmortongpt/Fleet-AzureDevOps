import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';

import { createLicense, listLicenses, allocateLicense, getExpiringLicenses } from '../services/licenseService';
import { logAudit, logError } from '../utils/logger';
import { validateLicenseInput, validateTenantId } from '../utils/validators';

const router = express.Router();
const pool = new Pool(); // Ensure this is configured with your database connection settings

router.use(helmet()); // Security headers
router.use(express.json());

// POST /api/licenses - create license
router.post('/api/licenses', async (req: Request, res: Response) => {
  try {
    const { tenant_id, licenseData } = req.body;
    if (!validateTenantId(tenant_id) || !validateLicenseInput(licenseData)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const license = await createLicense(pool, tenant_id, licenseData);
    logAudit('License created', { tenant_id, licenseId: license.id });
    res.status(201).json(license);
  } catch (error) {
    logError('Error creating license', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/licenses - list with usage stats
router.get('/api/licenses', async (req: Request, res: Response) => {
  try {
    const tenant_id = req.query.tenant_id as string;
    if (!validateTenantId(tenant_id)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }

    const licenses = await listLicenses(pool, tenant_id);
    res.status(200).json(licenses);
  } catch (error) {
    logError('Error listing licenses', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/licenses/:id/allocate - assign to asset/user
router.post('/api/licenses/:id/allocate', async (req: Request, res: Response) => {
  try {
    const { tenant_id, assetId, userId } = req.body;
    const licenseId = req.params.id;

    if (!validateTenantId(tenant_id) || !licenseId || (!assetId && !userId)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    await allocateLicense(pool, tenant_id, licenseId, assetId, userId);
    logAudit('License allocated', { tenant_id, licenseId, assetId, userId });
    res.status(200).json({ message: 'License allocated successfully' });
  } catch (error) {
    logError('Error allocating license', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/licenses/expiring - renewal alerts
router.get('/api/licenses/expiring', async (req: Request, res: Response) => {
  try {
    const tenant_id = req.query.tenant_id as string;
    if (!validateTenantId(tenant_id)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }

    const expiringLicenses = await getExpiringLicenses(pool, tenant_id);
    res.status(200).json(expiringLicenses);
  } catch (error) {
    logError('Error fetching expiring licenses', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;