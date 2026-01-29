
import express, { Request, Response, NextFunction } from 'express';

import pool from '../config/database';
import { authenticateJWT } from '../middleware/auth';

// Assuming pool is exported from db/connection or config/database

const router = express.Router();

// Camera sources endpoints (stub implementations until camera_sources table is created)
// IMPORTANT: These must be defined BEFORE /:id to avoid route conflicts
router.get('/sources', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources table and query
    // For now, return empty array to prevent 500 error
    res.json([]);
  } catch (err) {
    next(err);
  }
});

router.get('/sources/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources retrieval
    res.status(404).json({ error: 'Camera source not found' });
  } catch (err) {
    next(err);
  }
});

router.post('/sources', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources creation
    res.status(501).json({ error: 'Camera sources creation not yet implemented' });
  } catch (err) {
    next(err);
  }
});

router.put('/sources/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources update
    res.status(501).json({ error: 'Camera sources update not yet implemented' });
  } catch (err) {
    next(err);
  }
});

router.delete('/sources/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources deletion
    res.status(501).json({ error: 'Camera sources deletion not yet implemented' });
  } catch (err) {
    next(err);
  }
});

// Specific routes before parameterized routes
router.get('/nearby', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius } = req.query;
    const result = await pool.query(
      'SELECT * FROM traffic_cameras WHERE ST_DWithin(geom::geography, ST_MakePoint($1, $2)::geography, $3)',
      [lng, lat, radius]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/route/:routeName', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM traffic_cameras WHERE route = $1', [req.params.routeName]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Base routes
router.get('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await pool.query('SELECT * FROM traffic_cameras LIMIT $1 OFFSET $2', [limit, offset]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Parameterized routes LAST to avoid matching specific routes
router.get('/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM traffic_cameras WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
