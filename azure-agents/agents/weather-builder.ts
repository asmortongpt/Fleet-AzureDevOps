#!/usr/bin/env tsx
/**
 * Autonomous Weather Integration Builder Agent
 * Builds complete NWS Weather API integration with map layers
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
  console.log('Weather Integration Builder - Starting');
  console.log('========================================\n');

  const tasks = [
    {
      name: 'Create NWS Weather service',
      file: `${API_DIR}/src/services/weather/nws.service.ts`,
      prompt: `Create National Weather Service API integration with:
- Fetch current weather conditions by lat/lng
- Fetch weather forecast (7-day)
- Fetch weather alerts for Florida
- Cache responses (5 minute TTL)
- Error handling with retries
- TypeScript interfaces for all responses
Use axios, implement rate limiting (1 req/sec), parameterized SQL only.`
    },
    {
      name: 'Create weather routes',
      file: `${API_DIR}/src/routes/weather.ts`,
      prompt: `Create weather API routes:
- GET /api/weather/current?lat=X&lng=Y - Current conditions
- GET /api/weather/forecast?lat=X&lng=Y - 7-day forecast
- GET /api/weather/alerts - Active Florida weather alerts
- GET /api/weather/radar - Latest radar imagery for Florida
Validate coordinates, use JWT middleware, return JSON responses.`
    },
    {
      name: 'Create weather map layer generator',
      file: `${API_DIR}/src/services/weather/map-layers.service.ts`,
      prompt: `Create weather map layer service:
- Generate GeoJSON for weather alerts (polygons)
- Generate point features for current conditions
- Include styling metadata (colors, icons)
- Support filtering by severity
Return RFC 7946 compliant GeoJSON.`
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
  console.log('Weather Integration Builder - Complete!');
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
