#!/usr/bin/env tsx
/**
 * Autonomous WebSocket Server Builder Agent
 * Builds WebSocket server for real-time vehicle tracking
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
  console.log('WebSocket Server Builder - Starting');
  console.log('========================================\n');

  const tasks = [
    {
      name: 'Create WebSocket server',
      file: `${API_DIR}/src/services/websocket/server.ts`,
      prompt: `Create WebSocket server with ws library:
- Listen on port 3001
- Authenticate clients using JWT from query string
- Support rooms by vehicle ID
- Broadcast vehicle location updates to subscribed clients
- Handle connect/disconnect/error events
- Implement heartbeat/ping-pong
Use ws library, TypeScript, proper error handling.`
    },
    {
      name: 'Create WebSocket message handlers',
      file: `${API_DIR}/src/services/websocket/handlers.ts`,
      prompt: `Create WebSocket message handlers:
- SUBSCRIBE_VEHICLE: Join vehicle tracking room
- UNSUBSCRIBE_VEHICLE: Leave vehicle tracking room
- LOCATION_UPDATE: Broadcast location to subscribers
- ALERT: Send emergency alerts
- PING/PONG: Heartbeat mechanism
Validate all messages, log events, TypeScript types for messages.`
    },
    {
      name: 'Create vehicle location broadcaster',
      file: `${API_DIR}/src/services/tracking/location-broadcaster.ts`,
      prompt: `Create location broadcast service:
- Poll database for vehicle location changes (every 5 seconds)
- Detect changed locations using timestamp comparison
- Broadcast to WebSocket clients subscribed to each vehicle
- Include speed, heading, address in broadcast
- Batch updates for performance
Use Drizzle ORM with parameterized queries only.`
    },
    {
      name: 'Integrate WebSocket with Express server',
      file: `${API_DIR}/src/server-websocket.ts`,
      prompt: `Create WebSocket integration for Express:
- Import existing Express app from src/server.ts
- Attach WebSocket server to same HTTP server
- Share port 3000 for both HTTP and WS
- Proper upgrade handling
- Graceful shutdown for both servers
Export combined server, maintain existing routes.`
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
  console.log('WebSocket Server Builder - Complete!');
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
