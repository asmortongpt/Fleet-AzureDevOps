#!/usr/bin/env tsx
/**
 * Autonomous Traffic Camera Integration Builder Agent
 * Builds complete Florida 511 Traffic Camera integration
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_DIR = '/home/azureuser/fleet-local/api';

async function main() {
  console.log('========================================');
  console.log('Traffic Camera Builder - Starting');
  console.log('========================================\n');

  const tasks = [
    {
      name: 'Create FL511 traffic camera service',
      file: `${API_DIR}/src/services/traffic/fl511-cameras.service.ts`,
      prompt: `Create Florida 511 traffic camera integration:
- Fetch all 411 Florida traffic cameras
- Parse XML/JSON feed from FL511
- Transform to standardized format with lat/lng
- Cache camera list (1 hour TTL)
- Include camera image URLs
- Support filtering by region/route
Use axios, implement proper error handling, TypeScript interfaces.`
    },
    {
      name: 'Create traffic camera routes',
      file: `${API_DIR}/src/routes/traffic-cameras.ts`,
      prompt: `Create traffic camera API routes:
- GET /api/traffic/cameras - List all cameras
- GET /api/traffic/cameras/:id - Get single camera
- GET /api/traffic/cameras/nearby?lat=X&lng=Y&radius=50 - Cameras within radius (miles)
- GET /api/traffic/cameras/route/:routeName - Cameras along route (I-75, I-95, etc)
Validate inputs, use JWT middleware, return JSON with pagination.`
    },
    {
      name: 'Create camera map layer generator',
      file: `${API_DIR}/src/services/traffic/camera-map-layers.service.ts`,
      prompt: `Create traffic camera map layer service:
- Generate GeoJSON FeatureCollection for cameras
- Include camera metadata (name, route, image URL)
- Support clustering for performance
- Add custom icons by camera status (active/inactive)
Return RFC 7946 compliant GeoJSON with proper styling.`
    },
    {
      name: 'Create camera database schema',
      file: `${API_DIR}/src/db/schemas/traffic-cameras.schema.ts`,
      prompt: `Create Drizzle ORM schema for traffic cameras:
- Table: traffic_cameras
- Fields: id (uuid), fl511_id (string), name (text), route (text), latitude (decimal), longitude (decimal), image_url (text), status (enum), last_updated (timestamp)
- Indexes: on lat/lng for geospatial queries, on route
- Relations: none needed
Use Drizzle pgTable, add proper constraints.`
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
  console.log('Traffic Camera Builder - Complete!');
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
