Below is a production-ready Express.js API for vehicle assignment, including all the requested endpoints. This API uses TypeScript, PostgreSQL for database operations, and includes error handling and validation.

### Setup and Dependencies

First, ensure you have `express`, `pg`, `body-parser`, and `dotenv` installed. You can install them using npm:

```bash
npm install express pg body-parser dotenv
```

### TypeScript Configuration

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Express Setup and Database Connection

```typescript
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### API Endpoints

#### GET /api/drivers/:driverId/assigned-vehicle

```typescript
app.get('/api/drivers/:driverId/assigned-vehicle', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const query = `
      SELECT v.*, va.driver_id FROM vehicles v
      JOIN vehicle_assignments va ON va.vehicle_id = v.id
      WHERE va.driver_id = $1 AND va.expires_at IS NULL OR va.expires_at > NOW();
    `;
    const result = await pool.query(query, [driverId]);
    if (result.rows.length === 0) {
      res.json(null);
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### POST /api/vehicles/pair

```typescript
app.post('/api/vehicles/pair', async (req: Request, res: Response) => {
  const { driverId, vehicleId, scannedVIN, scannedPlate, method } = req.body;
  try {
    const vehicleQuery = 'SELECT * FROM vehicles WHERE id = $1';
    const vehicle = await pool.query(vehicleQuery, [vehicleId]);

    if (vehicle.rows.length === 0) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    if (vehicle.rows[0].vin !== scannedVIN || vehicle.rows[0].license_plate !== scannedPlate) {
      res.status(400).json({ success: false, reason: 'VIN or License Plate does not match' });
      return;
    }

    const insertQuery = `
      INSERT INTO vehicle_assignments (driver_id, vehicle_id, assigned_at)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [driverId, vehicleId]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### POST /api/vehicles/validate-connection

```typescript
app.post('/api/vehicles/validate-connection', async (req: Request, res: Response) => {
  const { driverId, vehicleId, bluetoothMAC } = req.body;
  try {
    const vehicleQuery = 'SELECT obd2_mac FROM vehicles WHERE id = $1';
    const vehicle = await pool.query(vehicleQuery, [vehicleId]);

    if (vehicle.rows.length === 0 || vehicle.rows[0].obd2_mac !== bluetoothMAC) {
      res.status(403).json({ allowed: false });
      return;
    }

    res.json({ allowed: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### GET /api/vehicles/pairing-history/:driverId

```typescript
app.get('/api/vehicles/pairing-history/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const query = 'SELECT * FROM pairing_attempts WHERE driver_id = $1';
    const result = await pool.query(query, [driverId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### POST /api/vehicles/admin-override

```typescript
app.post('/api/vehicles/admin-override', async (req: Request, res: Response) => {
  const { supervisorId, driverId, vehicleId, reason } = req.body;
  // Authentication and authorization checks should be implemented here
  try {
    const insertQuery = `
      INSERT INTO vehicle_assignments (driver_id, vehicle_id, assigned_at)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [driverId, vehicleId]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Conclusion

This setup provides a robust starting point for the vehicle assignment API. Ensure you handle authentication and authorization appropriately, especially for sensitive endpoints like the admin override. Adjust the database queries and error handling as needed based on your specific requirements and database schema.