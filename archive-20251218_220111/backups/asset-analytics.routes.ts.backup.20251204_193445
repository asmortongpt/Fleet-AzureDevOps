import express from 'express';
import { checkJwt } from '../middleware/auth';
import { checkRole } from '../middleware/role.middleware';
import { UtilizationCalcService } from '../services/utilization-calc.service';
import { ROICalculatorService } from '../services/roi-calculator.service';
import { asyncHandler } from '../utils/async-handler';
import { z } from 'zod';

const router = express.Router();
const utilizationCalcService = new UtilizationCalcService();
const roiCalculatorService = new ROICalculatorService();

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * @api {get} /api/analytics/utilization Daily Utilization Metrics
 * @apiName GetDailyUtilization
 * @apiGroup Analytics
 * @apiPermission manager
 * 
 * @apiParam {String} startDate Start date in YYYY-MM-DD format.
 * @apiParam {String} endDate End date in YYYY-MM-DD format.
 * 
 * @apiSuccess {Object[]} utilizationMetrics Array of daily utilization metrics.
 */
router.get('/utilization', checkJwt, checkRole(['manager']), asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRangeSchema.parse(req.query);
  const utilizationMetrics = await utilizationCalcService.getDailyUtilization(startDate, endDate);
  res.json(utilizationMetrics);
}));

/**
 * @api {get} /api/analytics/roi ROI Calculation
 * @apiName GetROI
 * @apiGroup Analytics
 * @apiPermission manager
 * 
 * @apiParam {String} startDate Start date in YYYY-MM-DD format.
 * @apiParam {String} endDate End date in YYYY-MM-DD format.
 * 
 * @apiSuccess {Object} roi ROI metrics.
 */
router.get('/roi', checkJwt, checkRole(['manager']), asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRangeSchema.parse(req.query);
  const roi = await roiCalculatorService.calculateROI(startDate, endDate);
  res.json(roi);
}));

/**
 * @api {get} /api/analytics/idle-assets Idle Assets Alert
 * @apiName GetIdleAssets
 * @apiGroup Analytics
 * @apiPermission manager
 * 
 * @apiSuccess {Object[]} idleAssets Array of assets that have been idle for more than 7 days.
 */
router.get('/idle-assets', checkJwt, checkRole(['manager']), asyncHandler(async (req, res) => {
  const idleAssets = await utilizationCalcService.getIdleAssets();
  res.json(idleAssets);
}));

/**
 * @api {get} /api/analytics/cost-per-mile Cost Per Mile
 * @apiName GetCostPerMile
 * @apiGroup Analytics
 * @apiPermission manager
 * 
 * @apiSuccess {Object[]} costPerMile Array of cost per mile data for assets.
 */
router.get('/cost-per-mile', checkJwt, checkRole(['manager']), asyncHandler(async (req, res) => {
  const costPerMileData = await roiCalculatorService.getCostPerMile();
  res.json(costPerMileData);
}));

export default router;