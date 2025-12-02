Sure, here is a TypeScript script that follows your requirements:

```typescript
import { Drizzle, Model } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as faker from 'faker';
import * as dotenv from 'dotenv';

dotenv.config();

interface User extends Model {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  location: string;
  phone: string;
  employeeId: string;
}

const roles = ['admin', 'manager', 'driver', 'mechanic'];
const departments = ['Sales', 'HR', 'Operations', 'Maintenance'];
const locations = ['Miami', 'Orlando', 'Tampa', 'Jacksonville'];

const drizzle = new Drizzle({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function seedUsers() {
  try {
    for (let i = 0; i < 25; i++) {
      const name = faker.name.findName();
      const email = faker.internet.email();
      const password = await bcrypt.hash('password', 12);
      const role = roles[Math.floor(Math.random() * roles.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const phone = faker.phone.phoneNumber();
      const employeeId = faker.random.uuid();

      const user: User = {
        id: i + 1,
        name,
        email,
        password,
        role,
        department,
        location,
        phone,
        employeeId,
      };

      await drizzle.query(
        'INSERT INTO users (id, name, email, password, role, department, location, phone, employee_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [user.id, user.name, user.email, user.password, user.role, user.department, user.location, user.phone, user.employeeId]
      );
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const adminUser: User = {
      id: 26,
      name: 'Admin',
      email: 'admin@fleet.fl.gov',
      password: adminPassword,
      role: 'admin',
      department: 'HR',
      location: 'Miami',
      phone: faker.phone.phoneNumber(),
      employeeId: faker.random.uuid(),
    };

    await drizzle.query(
      'INSERT INTO users (id, name, email, password, role, department, location, phone, employee_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [adminUser.id, adminUser.name, adminUser.email, adminUser.password, adminUser.role, adminUser.department, adminUser.location, adminUser.phone, adminUser.employeeId]
    );

    console.log('User seeding completed successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    drizzle.close();
  }
}

seedUsers();
```

This script creates 25 users with random data and an admin user with the specified credentials. It uses environment variables for the database configuration, bcrypt for password hashing, faker.js for generating realistic data, and Drizzle ORM for database operations. It also includes proper error handling.