Here's an example of how you might implement this in TypeScript. This example uses the `pg-promise` library for PostgreSQL and `dotenv` for environment variables. 

```typescript
import { IDatabase, IMain } from 'pg-promise';
import * as pgPromise from 'pg-promise';
import * as dotenv from 'dotenv';

dotenv.config();

const pgp: IMain = pgPromise();

interface IMaintenanceRecord {
    id: number;
    status: string;
    type: string;
    cost: number;
    vehicleId: number;
    mechanicId: number;
    partsUsed: string;
    laborHours: number;
    date: Date;
}

const db: IDatabase<any> = pgp({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT!,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function seedMaintenanceRecords() {
    const maintenanceTypes = ['oil change', 'tire rotation', 'inspection', 'repair'];
    const statuses = ['completed', 'scheduled', 'overdue'];

    for (let i = 0; i < 200; i++) {
        const record: IMaintenanceRecord = {
            id: i,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            type: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
            cost: Math.floor(Math.random() * (2000 - 50 + 1)) + 50,
            vehicleId: Math.floor(Math.random() * 100),
            mechanicId: Math.floor(Math.random() * 100),
            partsUsed: 'Part ' + Math.floor(Math.random() * 100),
            laborHours: Math.floor(Math.random() * 10),
            date: new Date(Date.now() - Math.floor(Math.random() * 2 * 365 * 24 * 60 * 60 * 1000))
        };

        try {
            await db.none('INSERT INTO maintenance_records VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
                [record.id, record.status, record.type, record.cost, record.vehicleId, record.mechanicId, record.partsUsed, record.laborHours, record.date]);
        } catch (error) {
            console.error('Error inserting maintenance record: ', error);
        }
    }
}

seedMaintenanceRecords().catch(error => {
    console.error('Error seeding maintenance records: ', error);
});
```

This script generates 200 maintenance records with random values and inserts them into a PostgreSQL database using parameterized queries. It uses environment variables for the database configuration and includes proper error handling. The `IMaintenanceRecord` interface is used to type the maintenance records.