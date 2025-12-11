Thank you for providing the refactored code. I'll present the complete file with all necessary imports and the full implementation of both the main file and the `camera-repository.ts` file.

Here's the complete refactored file:


// main.ts

import express, { Request, Response, NextFunction } from 'express';
import jwt from 'express-jwt';
import { config } from 'dotenv';
import { csrfProtection } from '../middleware/csrf';
import { CameraRepository } from './camera-repository';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';

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


And here's the complete `camera-repository.ts` file:


// camera-repository.ts

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


This refactored code implements the repository pattern by moving all database operations into the `CameraRepository` class. The main file now uses this repository to interact with the database, improving separation of concerns and making the code more maintainable.

To use this refactored code, ensure that you have the following files and their contents:

1. `main.ts`: The main file containing the Express app and route handlers.
2. `camera-repository.ts`: The file containing the `CameraRepository` class.
3. `../middleware/errorHandler.ts`: Should contain the `asyncHandler` function.
4. `../errors/app-error.ts`: Should contain the `NotFoundError` and `ValidationError` classes.
5. `../middleware/csrf.ts`: Should contain the `csrfProtection` middleware.

Also, make sure that your `.env` file contains the necessary environment variables:


JWT_SECRET=your_jwt_secret
PORT=your_port_number
DATABASE_URL=your_database_url


This refactored version should provide a cleaner, more maintainable structure for your application while maintaining the same functionality as the original code.