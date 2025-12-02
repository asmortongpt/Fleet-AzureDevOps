Here is a TypeScript code snippet that follows the security rules you provided:

```typescript
import { Pool } from 'pg';
import { config } from 'dotenv';
import { usersSeed } from './seeds/users.seed';
import { vehiclesSeed } from './seeds/vehicles.seed';
import { maintenanceSeed } from './seeds/maintenance.seed';
import { partsSeed } from './seeds/parts.seed';

config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

type SeedFunction = (pool: Pool) => Promise<void>;

const seeds: SeedFunction[] = [
  usersSeed,
  vehiclesSeed,
  maintenanceSeed,
  partsSeed,
];

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const seed of seeds) {
      console.log(`Running ${seed.name}`);
      await seed(client);
      console.log(`Finished ${seed.name}`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error running seeds', err);
  } finally {
    client.release();
  }
}

seed().catch((err) => {
  console.error('Error in seed function', err);
  process.exit(1);
});
```

In the `package.json` file, add the following script:

```json
"scripts": {
  "db:seed": "ts-node src/db/seed.ts"
}
```

This script will run the `seed` function when you execute `npm run db:seed` in the command line. The `seed` function will connect to the database, begin a transaction, and run each seed script in order. If any script fails, it will rollback the transaction and log the error. If all scripts succeed, it will commit the transaction. It will then release the database client and exit. If there is an error connecting to the database or beginning the transaction, it will log the error and exit with a non-zero status code.