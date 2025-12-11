import express, { Request, Response, NextFunction } from 'express';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';
import { csrfProtection } from '../middleware/csrf';
import { WeatherRepository } from '../repositories/weatherRepository';
import { ForecastRepository } from '../repositories/forecastRepository';
import { AlertRepository } from '../repositories/alertRepository';
import { RadarRepository } from '../repositories/radarRepository';

dotenv.config();

const app = express();

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

type Coordinate = {
  lat: number;
  lng: number;
};

const weatherRepository = new WeatherRepository();
const forecastRepository = new ForecastRepository();
const alertRepository = new AlertRepository();
const radarRepository = new RadarRepository();

app.get('/api/weather/current', async (req: Request, res: Response, next: NextFunction) => {
  const { lat, lng }: Coordinate = req.query;

  if (!lat || !lng) {
    throw new ValidationError("Invalid coordinates");
  }

  try {
    const result = await weatherRepository.getCurrentWeather(lat, lng);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/forecast', async (req: Request, res: Response, next: NextFunction) => {
  const { lat, lng }: Coordinate = req.query;

  if (!lat || !lng) {
    throw new ValidationError("Invalid coordinates");
  }

  try {
    const result = await forecastRepository.getForecast(lat, lng);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/alerts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await alertRepository.getAlerts('Florida');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/radar', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await radarRepository.getRadar('Florida');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

// Inline repository methods (to be moved to respective repositories later)

class WeatherRepository {
  async getCurrentWeather(lat: number, lng: number): Promise<any> {
    // Placeholder for actual repository method
    return { lat, lng, temperature: 25, humidity: 60 };
  }
}

class ForecastRepository {
  async getForecast(lat: number, lng: number): Promise<any[]> {
    // Placeholder for actual repository method
    return [{ lat, lng, date: '2023-10-01', temperature: 25 }];
  }
}

class AlertRepository {
  async getAlerts(state: string): Promise<any[]> {
    // Placeholder for actual repository method
    return [{ state, alert: 'Storm warning' }];
  }
}

class RadarRepository {
  async getRadar(state: string): Promise<any[]> {
    // Placeholder for actual repository method
    return [{ state, radarData: 'some radar data' }];
  }
}