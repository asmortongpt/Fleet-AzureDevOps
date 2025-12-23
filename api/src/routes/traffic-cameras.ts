
import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';

// Assuming pool is exported from db/connection or config/database
import pool from '../config/database';

const router = express.Router();

router.get('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await pool.query('SELECT * FROM cameras LIMIT $1 OFFSET $2', [limit, offset]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM cameras WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/nearby', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius } = req.query;
    const result = await pool.query(
      'SELECT * FROM cameras WHERE ST_DWithin(geom::geography, ST_MakePoint($1, $2)::geography, $3)',
      [lng, lat, radius]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/route/:routeName', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM cameras WHERE route_name = $1', [req.params.routeName]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
