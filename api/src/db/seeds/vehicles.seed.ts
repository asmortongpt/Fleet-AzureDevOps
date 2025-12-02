Sure, here is a script that follows your specifications:

```typescript
import { Connection, createConnection } from 'drizzle-orm';
import faker from 'faker';
import dotenv from 'dotenv';

dotenv.config();

type Vehicle = {
  vin: string;
  licensePlate: string;
  year: number;
  make: string;
  model: string;
  odometer: number;
  maintenanceStatus: string;
  department: string;
};

const makes = ['Ford', 'Chevrolet', 'Dodge', 'Toyota'];
const models = ['Sedan', 'SUV', 'Truck', 'Van'];
const departments = ['Sales', 'HR', 'Engineering', 'Marketing'];

async function seedVehicles() {
  const connection: Connection = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  for (let i = 0; i < 50; i++) {
    const vehicle: Vehicle = {
      vin: faker.vehicle.vin(),
      licensePlate: faker.vehicle.vrm(),
      year: faker.random.number({ min: 2018, max: 2024 }),
      make: faker.random.arrayElement(makes),
      model: faker.random.arrayElement(models),
      odometer: faker.random.number({ min: 0, max: 200000 }),
      maintenanceStatus: faker.random.boolean() ? 'Good' : 'Requires Maintenance',
      department: faker.random.arrayElement(departments),
    };

    try {
      await connection.query(
        `INSERT INTO vehicles (vin, license_plate, year, make, model, odometer, maintenance_status, department) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [vehicle.vin, vehicle.licensePlate, vehicle.year, vehicle.make, vehicle.model, vehicle.odometer, vehicle.maintenanceStatus, vehicle.department]
      );
    } catch (error) {
      console.error(`Error inserting vehicle: ${error}`);
    }
  }

  await connection.close();
}

seedVehicles().catch((error) => console.error(`Error seeding vehicles: ${error}`));
```

This script generates 50 vehicles with realistic data using faker.js and inserts them into a database using Drizzle ORM with parameterized queries. It uses environment variables for the database configuration and implements proper error handling. It also includes TypeScript types for everything.