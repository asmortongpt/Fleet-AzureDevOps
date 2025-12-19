import express, { Request, Response, NextFunction } from 'express';
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import helmet from 'helmet';
import csurf from 'csurf';
import rateLimit from 'express-rate-limit';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { z } from 'zod';

dotenv.config();

const app = express();

app.use(express.json());
app.use(helmet());
app.use(express.static('public', { maxAge: '1y', immutable: true }));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(csurf());

// JWT middleware
app.use(
  jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: process.env.JWKS_URI,
    }),
    audience: process.env.AUDIENCE,
    issuer: process.env.ISSUER,
    algorithms: ['RS256'],
  }))
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CoordinateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

app.get('/api/weather/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coordinates = CoordinateSchema.parse(req.query);
    const result = await pool.query('SELECT * FROM weather WHERE lat = $1 AND lng = $2', [coordinates.lat, coordinates.lng]);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/forecast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coordinates = CoordinateSchema.parse(req.query);
    const result = await pool.query('SELECT * FROM forecast WHERE lat = $1 AND lng = $2', [coordinates.lat, coordinates.lng]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/alerts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM alerts WHERE state = $1', ['Florida']);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/radar', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM radar WHERE state = $1', ['Florida']);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Invalid input', details: err.errors });
  }
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});