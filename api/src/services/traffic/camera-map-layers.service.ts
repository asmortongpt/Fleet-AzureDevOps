Here is a TypeScript code snippet that follows the security rules you provided:

```typescript
import { Pool } from 'pg';
import { config } from 'dotenv';
import { FeatureCollection, Point } from 'geojson';

config();

interface Camera {
  id: string;
  name: string;
  route: string;
  imageUrl: string;
  status: string;
  lat: number;
  lon: number;
}

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
});

async function getCameras(): Promise<Camera[]> {
  try {
    const res = await pool.query('SELECT id, name, created_at, updated_at, tenant_id FROM cameras');
    return res.rows;
  } catch (err) {
    console.error(err);
    return [];
  }
}

function toGeoJson(cameras: Camera[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: cameras.map(camera => ({
      type: 'Feature',
      properties: {
        id: camera.id,
        name: camera.name,
        route: camera.route,
        imageUrl: camera.imageUrl,
        status: camera.status,
        icon: camera.status === 'active' ? 'active-icon.png' : 'inactive-icon.png',
      },
      geometry: {
        type: 'Point',
        coordinates: [camera.lon, camera.lat],
      },
    })),
  };
}

async function main() {
  const cameras = await getCameras();
  const geoJson = toGeoJson(cameras);
  console.log(JSON.stringify(geoJson, null, 2));
}

main().catch(console.error);
```

This script uses the `pg` library to connect to a PostgreSQL database and fetch camera data. The database connection parameters are loaded from environment variables using the `dotenv` library.

The `getCameras` function fetches all cameras from the database and returns them as an array of `Camera` objects. If an error occurs during the database query, it is logged to the console and an empty array is returned.

The `toGeoJson` function converts an array of `Camera` objects to a GeoJSON `FeatureCollection`. Each camera is represented as a `Feature` with a `Point` geometry and properties containing the camera metadata. The icon property is set based on the camera status.

The `main` function fetches the cameras, converts them to GeoJSON, and logs the result to the console. If an error occurs, it is logged to the console.