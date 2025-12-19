Here is a TypeScript code snippet that follows the security rules and requirements you provided:

```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { Pool } from 'pg';
import dotenv from 'dotenv';

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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type Coordinate = {
  lat: number;
  lng: number;
};

app.get('/api/weather/current', async (req: Request, res: Response, next: NextFunction) => {
  const { lat, lng }: Coordinate = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const result = await pool.query('SELECT * FROM weather WHERE lat = $1 AND lng = $2', [lat, lng]);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get('/api/weather/forecast', async (req: Request, res: Response, next: NextFunction) => {
  const { lat, lng }: Coordinate = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const result = await pool.query('SELECT * FROM forecast WHERE lat = $1 AND lng = $2', [lat, lng]);
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
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
```

This code uses the `express-jwt` and `jwks-rsa` libraries for JWT authentication. It also uses the `pg` library to interact with a PostgreSQL database using parameterized queries. The `dotenv` library is used to load environment variables from a `.env` file. The code includes error handling middleware at the end of the file to catch any errors that occur in the route handlers.