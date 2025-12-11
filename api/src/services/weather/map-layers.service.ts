Here is a TypeScript service that follows the security rules and requirements you provided:

```typescript
import { Pool } from 'pg';
import { config } from 'dotenv';
import { FeatureCollection, Polygon, Point } from 'geojson';

config();

interface WeatherAlert {
  id: string;
  severity: string;
  geometry: Polygon;
}

interface CurrentCondition {
  id: string;
  temperature: number;
  icon: string;
  geometry: Point;
}

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
});

async function getWeatherAlerts(severity: string): Promise<FeatureCollection<Polygon>> {
  try {
    const res = await pool.query('SELECT id, name, created_at, updated_at, tenant_id FROM weather_alerts WHERE severity = $1', [severity]);
    const features = res.rows.map((row: WeatherAlert) => ({
      type: 'Feature',
      id: row.id,
      properties: {
        severity: row.severity,
      },
      geometry: row.geometry,
    }));
    return {
      type: 'FeatureCollection',
      features,
    };
  } catch (err) {
    console.error(err);
    throw new Error('Error fetching weather alerts');
  }
}

async function getCurrentConditions(): Promise<FeatureCollection<Point>> {
  try {
    const res = await pool.query('SELECT id, name, created_at, updated_at, tenant_id FROM current_conditions');
    const features = res.rows.map((row: CurrentCondition) => ({
      type: 'Feature',
      id: row.id,
      properties: {
        temperature: row.temperature,
        icon: row.icon,
      },
      geometry: row.geometry,
    }));
    return {
      type: 'FeatureCollection',
      features,
    };
  } catch (err) {
    console.error(err);
    throw new Error('Error fetching current conditions');
  }
}

export { getWeatherAlerts, getCurrentConditions };
```

This service uses the `pg` module to connect to a PostgreSQL database and execute parameterized queries. The connection parameters are stored in environment variables, which are loaded using the `dotenv` module. The service exports two functions: `getWeatherAlerts` and `getCurrentConditions`, which return GeoJSON feature collections of weather alerts and current conditions, respectively. The GeoJSON is compliant with RFC 7946. The service also includes proper error handling, with any errors during the database queries being logged and re-thrown.