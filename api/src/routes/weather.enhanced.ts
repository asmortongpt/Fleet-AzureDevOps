import express, { Request, Response, NextFunction } from 'express';
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import helmet from 'helmet';
import csurf from 'csurf';
import rateLimit from 'express-rate-limit';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf'

// Import necessary repositories
import { WeatherRepository } from '../repositories/weather.repository';
import { ForecastRepository } from '../repositories/forecast.repository';
import { AlertRepository } from '../repositories/alert.repository';
import { RadarRepository } from '../repositories/radar.repository';

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
  })
);

const CoordinateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

app.get('/api/weather/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coordinates = CoordinateSchema.parse(req.query);
    const weatherRepository = container.resolve(WeatherRepository);
    const result = await weatherRepository.getCurrentWeather(coordinates.lat, coordinates.lng);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/forecast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coordinates = CoordinateSchema.parse(req.query);
    const forecastRepository = container.resolve(ForecastRepository);
    const result = await forecastRepository.getForecast(coordinates.lat, coordinates.lng);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/alerts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const alertRepository = container.resolve(AlertRepository);
    const result = await alertRepository.getAlertsForState('Florida');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/radar', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const radarRepository = container.resolve(RadarRepository);
    const result = await radarRepository.getRadarForState('Florida');
    res.json(result);
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

// Inline repository methods (to be moved to respective repositories later)

class WeatherRepository {
  async getCurrentWeather(lat: number, lng: number): Promise<any> {
    // This method should be implemented in the actual WeatherRepository
    // For now, it's a placeholder to replace the direct query
    return { /* mock data */ };
  }
}

class ForecastRepository {
  async getForecast(lat: number, lng: number): Promise<any[]> {
    // This method should be implemented in the actual ForecastRepository
    // For now, it's a placeholder to replace the direct query
    return [{ /* mock data */ }];
  }
}

class AlertRepository {
  async getAlertsForState(state: string): Promise<any[]> {
    // This method should be implemented in the actual AlertRepository
    // For now, it's a placeholder to replace the direct query
    return [{ /* mock data */ }];
  }
}

class RadarRepository {
  async getRadarForState(state: string): Promise<any[]> {
    // This method should be implemented in the actual RadarRepository
    // For now, it's a placeholder to replace the direct query
    return [{ /* mock data */ }];
  }
}