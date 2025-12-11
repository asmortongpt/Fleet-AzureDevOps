To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a repository class and update the route handlers to use it. Here's the complete refactored file:


import express, { Request, Response, NextFunction } from 'express';
import jwt from 'express-jwt';
import { config } from 'dotenv';
import { csrfProtection } from '../middleware/csrf';
import { CameraRepository } from './camera-repository';

config();

const app = express();
app.use(jwt({ secret: process.env.JWT_SECRET }));
app.use(csrfProtection);

// Initialize the CameraRepository
const cameraRepository = new CameraRepository();

// Route to get all cameras with pagination
app.get('/api/traffic/cameras', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;
  const cameras = await cameraRepository.getAllCameras(limit, offset);
  res.json(cameras);
}));

// Route to get a specific camera by ID
app.get('/api/traffic/cameras/:id', asyncHandler(async (req: Request, res: Response) => {
  const camera = await cameraRepository.getCameraById(req.params.id);
  if (!camera) {
    throw new NotFoundError('Camera not found');
  }
  res.json(camera);
}));

// Route to get nearby cameras
app.get('/api/traffic/cameras/nearby', asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng || !radius) {
    throw new ValidationError('Latitude, longitude, and radius are required');
  }
  const cameras = await cameraRepository.getNearbyCameras(
    parseFloat(lat as string),
    parseFloat(lng as string),
    parseFloat(radius as string)
  );
  res.json(cameras);
}));

// Route to get cameras on a specific route
app.get('/api/traffic/cameras/route/:routeName', asyncHandler(async (req: Request, res: Response) => {
  const cameras = await cameraRepository.getCamerasByRoute(req.params.routeName);
  res.json(cameras);
}));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  } else if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
  } else {
    res.status(500).send('Something broke!');
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});


Now, let's create the `camera-repository.ts` file that will contain the `CameraRepository` class:


import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class CameraRepository {
  async getAllCameras(limit: number, offset: number): Promise<any[]> {
    const result = await pool.query('SELECT * FROM cameras LIMIT $1 OFFSET $2', [limit, offset]);
    return result.rows;
  }

  async getCameraById(id: string): Promise<any | null> {
    const result = await pool.query('SELECT * FROM cameras WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getNearbyCameras(lat: number, lng: number, radius: number): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM cameras WHERE ST_DWithin(geom::geography, ST_MakePoint($1, $2)::geography, $3)',
      [lng, lat, radius]
    );
    return result.rows;
  }

  async getCamerasByRoute(routeName: string): Promise<any[]> {
    const result = await pool.query('SELECT * FROM cameras WHERE route_name = $1', [routeName]);
    return result.rows;
  }
}


This refactoring introduces several improvements:

1. We've created a `CameraRepository` class that encapsulates all database operations related to cameras.
2. The route handlers now use the repository methods instead of directly querying the database.
3. We've replaced the try-catch blocks with the `asyncHandler` middleware, which is assumed to be imported from '../middleware/errorHandler'.
4. We've added error handling for `NotFoundError` and `ValidationError`, which are assumed to be imported from '../errors/app-error'.
5. The `CameraRepository` class is initialized once and reused across all routes, which is more efficient than creating a new connection pool for each request.

To make this code work, you'll need to ensure that the following imports are available:

- `asyncHandler` from '../middleware/errorHandler'
- `NotFoundError` and `ValidationError` from '../errors/app-error'

Also, make sure that the `camera-repository.ts` file is in the same directory as the main file, or adjust the import path accordingly.