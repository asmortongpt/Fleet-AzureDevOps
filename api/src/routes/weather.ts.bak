
import express, { Request, Response, NextFunction } from 'express';

import pool from '../config/database';
import { authenticateJWT } from '../middleware/auth';

// Assuming pool is exported from db/connection or config/database. Using common pattern.

const router = express.Router();

type Coordinate = {
  lat: number;
  lng: number;
};

router.get('/current', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

  if (lat === undefined || lng === undefined) {
    res.status(400).json({ error: "Invalid coordinates" });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM weather WHERE lat = $1 AND lng = $2', [lat, lng]);
    res.json(result.rows[0] || {});
  } catch (err) {
    next(err);
  }
});

router.get('/forecast', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

  if (lat === undefined || lng === undefined) {
    res.status(400).json({ error: "Invalid coordinates" });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM forecasts WHERE lat = $1 AND lng = $2', [lat, lng]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/alerts', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM weather_alerts WHERE state = $1', ['Florida']);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/radar', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM weather_radar WHERE state = $1', ['Florida']);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
