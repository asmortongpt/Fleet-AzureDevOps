Sure, here is a TypeScript script that follows your requirements:

```typescript
import { createConnection, Connection, Repository } from 'typeorm';
import { config } from 'dotenv';
import { Part } from './entities/Part';
import faker from 'faker';

config();

type PartCategory = 'filters' | 'fluids' | 'tires' | 'batteries' | 'brakes';

interface PartData {
  partNumber: string;
  manufacturer: string;
  stockQuantity: number;
  cost: number;
  retailPrice: number;
  reorderPoint: number;
  supplier: string;
  compatibilityData: string;
  category: PartCategory;
}

async function main() {
  let connection: Connection;

  try {
    connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [Part],
      synchronize: true,
    });

    const partRepository: Repository<Part> = connection.getRepository(Part);

    const categories: PartCategory[] = ['filters', 'fluids', 'tires', 'batteries', 'brakes'];

    const parts: PartData[] = Array.from({ length: 100 }, () => ({
      partNumber: faker.random.alphaNumeric(10),
      manufacturer: faker.company.companyName(),
      stockQuantity: faker.random.number({ min: 0, max: 100 }),
      cost: faker.commerce.price(),
      retailPrice: faker.commerce.price(),
      reorderPoint: faker.random.number({ min: 0, max: 50 }),
      supplier: faker.company.companyName(),
      compatibilityData: faker.random.words(5),
      category: faker.random.arrayElement(categories),
    }));

    await partRepository.save(parts);
  } catch (error) {
    console.error('Error seeding database', error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

main();
```

This script uses the TypeORM library to connect to a PostgreSQL database and the faker library to generate realistic data. It creates 100 parts, each with a part number, manufacturer, stock quantity, cost, retail price, reorder point, supplier, compatibility data, and category. The script also follows the security rules you provided. 

Please note that you need to create the `Part` entity and the `.env` file with your database credentials.