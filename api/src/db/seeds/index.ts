import { config } from 'dotenv';
import { Pool } from 'pg';

import { maintenanceSeed } from './maintenance.seed';
import { partsSeed } from './parts.seed';
import { usersSeed } from './users.seed';
import { vehiclesSeed } from './vehicles.seed';

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

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const seedFunc of seeds) {
      console.log(`Running ${seedFunc.name}`);
      await seedFunc(pool);
      console.log(`Finished ${seedFunc.name}`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error running seeds', err);
    throw err;
  } finally {
    client.release();
  }
}

seed().catch((err) => {
  console.error('Error in seed function', err);
  process.exit(1);
});
