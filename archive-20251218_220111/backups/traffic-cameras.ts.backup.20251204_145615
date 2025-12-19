Here is a basic implementation of the API routes you requested:
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'

```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'express-jwt';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
app.use(jwt({ secret: process.env.JWT_SECRET }));

app.get('/api/traffic/cameras', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM cameras LIMIT $1 OFFSET $2', [req.query.limit, req.query.offset]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get('/api/traffic/cameras/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM cameras WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get('/api/traffic/cameras/nearby', async (req: Request, res: Response, next: NextFunction) => {
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

app.get('/api/traffic/cameras/route/:routeName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM cameras WHERE route_name = $1', [req.params.routeName]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
```

This code uses the `pg` library for PostgreSQL and `express-jwt` for JWT authentication. The `dotenv` library is used to load environment variables from a `.env` file. All SQL queries are parameterized to prevent SQL injection attacks. The `ST_DWithin` function in the nearby cameras route is a PostGIS function that finds points within a certain distance of another point. The error handling middleware at the end will catch any errors that occur in the route handlers and send a 500 response.