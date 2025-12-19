import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import executiveDashboardService from '../services/executive-dashboard.service';
import { cacheMiddleware } from '../middleware/cache';
import { z } from 'zod';

const router = express.Router();

router.use(authenticateJWT);

const KPIResponseSchema = z.object({
  totalVehicles: z.number(),
  activeVehicles: z.number(),
  fleetUtilizationRate: z.number(),
  avgFuelEfficiency: z.number(),
});

router.get(
  '/kpis',
  requirePermission('report:view:global'),
  cacheMiddleware({ ttl: 30, varyByTenant: true, varyByUser: false }),
  auditLog({ action: 'READ', resourceType: 'executive_dashboard' }),
  async (req: Request, res: Response) => {
    try {
      const kpis = await executiveDashboardService.getKPIs(req.user!.tenant_id);
      const result = KPIResponseSchema.parse(kpis);
      res.json(result);
    } catch (error) {
      console.error('Get executive KPIs error:', error);
      res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
  },
);

const TrendQuerySchema = z.object({
  days: z.string().optional(),
});

const TrendResponseSchema = z.array(
  z.object({
    date: z.string(),
    utilization: z.number(),
    costs: z.number(),
    incidents: z.number(),
    maintenance: z.number(),
  }),
);

router.get(
  '/trends',
  requirePermission('report:view:global'),
  cacheMiddleware({ ttl: 30, varyByTenant: true, varyByQuery: true, varyByUser: false }),
  auditLog({ action: 'READ', resourceType: 'executive_dashboard' }),
  async (req: Request, res: Response) => {
    try {
      const queryResult = TrendQuerySchema.parse(req.query);
      const days = parseInt(queryResult.days || '30');
      const trends = await executiveDashboardService.getTrends(req.user!.tenant_id, days);
      const result = TrendResponseSchema.parse(trends);
      res.json(result);
    } catch (error) {
      console.error('Get trend data error:', error);
      res.status(500).json({ error: 'Failed to fetch trend data' });
    }
  },
);

export default router;