#!/usr/bin/env tsx
/**
 * Autonomous Database Seeding Builder Agent
 * Builds comprehensive database seeding scripts with realistic data
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_DIR = '/home/azureuser/fleet-local/api';

async function main() {
  console.log('========================================');
  console.log('Database Seeding Builder - Starting');
  console.log('========================================\n');

  const tasks = [
    {
      name: 'Create vehicle seeding script',
      file: `${API_DIR}/src/db/seeds/vehicles.seed.ts`,
      prompt: `Create vehicle seeding script:
- Generate 50 realistic Florida state vehicles
- Mix of sedans, SUVs, trucks, vans
- Realistic VINs, license plates (Florida format)
- Years 2018-2024
- Makes: Ford, Chevrolet, Dodge, Toyota
- Include odometer readings, maintenance status
- Assign to different departments
Use Drizzle ORM with parameterized queries, faker.js for data generation.`
    },
    {
      name: 'Create user seeding script',
      file: `${API_DIR}/src/db/seeds/users.seed.ts`,
      prompt: `Create user seeding script:
- Generate 25 users across roles (admin, manager, driver, mechanic)
- Realistic Florida names and emails
- Hash passwords with bcrypt (cost 12)
- Different departments and locations
- Include profile data (phone, employee ID)
- Admin user: admin@fleet.fl.gov / Admin123!
Use Drizzle ORM, bcrypt for passwords, faker.js for realistic data.`
    },
    {
      name: 'Create maintenance records seeding',
      file: `${API_DIR}/src/db/seeds/maintenance.seed.ts`,
      prompt: `Create maintenance records seeding:
- Generate 200 maintenance records
- Mix of completed, scheduled, overdue
- Types: oil change, tire rotation, inspection, repair
- Realistic costs ($50-$2000)
- Link to vehicles and mechanics
- Include parts used, labor hours
- Historical dates (past 2 years)
Use Drizzle ORM with parameterized queries, realistic Florida service providers.`
    },
    {
      name: 'Create parts inventory seeding',
      file: `${API_DIR}/src/db/seeds/parts.seed.ts`,
      prompt: `Create parts inventory seeding:
- Generate 100 common vehicle parts
- Categories: filters, fluids, tires, batteries, brakes
- Realistic part numbers, manufacturers
- Stock quantities (0-100)
- Costs and retail prices
- Reorder points and suppliers
- Include compatibility data
Use Drizzle ORM, realistic automotive part data.`
    },
    {
      name: 'Create master seeding script',
      file: `${API_DIR}/src/db/seeds/index.ts`,
      prompt: `Create master seeding orchestrator:
- Import all seed scripts
- Run in correct order (users, vehicles, maintenance, parts)
- Clear existing data first (truncate tables)
- Transaction support for rollback on error
- Progress logging
- CLI command: npm run db:seed
Export async seed() function, handle errors gracefully.`
    }
  ];

  for (const task of tasks) {
    console.log(`\n[TASK] ${task.name}`);
    console.log(`[FILE] ${task.file}`);

    const dir = path.dirname(task.file);
    await fs.mkdir(dir, { recursive: true });

    const code = await generateCode(task.prompt);
    await fs.writeFile(task.file, code);
    console.log(`Created: ${task.file}`);
  }

  console.log('\n========================================');
  console.log('Database Seeding Builder - Complete!');
  console.log('========================================\n');
}

async function generateCode(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert TypeScript developer. Generate production-ready code following these security rules: 1) Use parameterized queries only ($1,$2,$3) - NEVER string concatenation in SQL, 2) Use environment variables for all config, 3) Implement proper error handling, 4) Add TypeScript types for everything, 5) Follow security best practices.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

main().catch(console.error);
