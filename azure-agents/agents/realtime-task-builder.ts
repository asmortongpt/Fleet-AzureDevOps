#!/usr/bin/env tsx
/**
 * Real-Time Task Builder Agent
 * Builds WebSocket server for real-time task updates with presence tracking
 */

import fs from 'fs/promises';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are an expert full-stack engineer building enterprise-grade real-time systems.

Create a COMPLETE, PRODUCTION-READY WebSocket server for real-time task management with these EXACT requirements:

## MANDATORY REQUIREMENTS:

### 1. SECURITY (Critical - Government/Enterprise):
- JWT RS256 authentication on WebSocket connection
- Multi-tenant isolation (users only see their tenant's events)
- Rate limiting: 100 events/minute per connection
- Input validation on all event payloads
- Audit logging for all connections and events
- Sanitize data before emitting (no sensitive fields)

### 2. REAL-TIME CAPABILITIES:
- Socket.IO 4.x server
- Redis pub/sub for horizontal scaling
- Event types: TASK_CREATED, TASK_UPDATED, TASK_ASSIGNED, TASK_DELETED, COMMENT_ADDED
- Presence tracking (who's viewing each task)
- JOIN/LEAVE room events
- Optimistic UI support (version vectors for conflict resolution)
- Automatic reconnection with exponential backoff

### 3. PERFORMANCE:
- Handle 1,000+ concurrent connections
- Event latency <100ms
- Batch events (max 50ms delay) to reduce network traffic
- Compress large payloads with zlib
- Redis keyspace notifications for scalability

### 4. ERROR HANDLING:
- Try/catch on ALL async operations
- Graceful degradation if Redis fails
- Reconnection logic with 3 retry attempts
- User-friendly error messages
- Comprehensive logging

### 5. TYPESCRIPT STRICT MODE:
- Full type coverage
- No 'any' types
- Zod schema validation for event payloads
- Exported TypeScript interfaces

### 6. TESTING:
- Unit tests (Vitest) for all services
- Integration tests for WebSocket server
- Mock Redis for tests

Generate COMPLETE files (not snippets):
1. api/src/websocket/task-realtime.server.ts (Socket.IO server)
2. api/src/websocket/presence.service.ts (Presence tracking)
3. api/src/websocket/conflict-resolution.service.ts (Version vectors)
4. api/migrations/020_websocket_events.sql (Database schema)
5. src/hooks/useRealtimeTasks.ts (React hook for frontend)

Return ONLY valid TypeScript/SQL code. No explanations.`;

interface FileOutput {
  path: string;
  content: string;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content
    .replace(/^```(?:typescript|sql|tsx)\n/gm, '')
    .replace(/\n```$/g, '');
}

async function buildFile(fileDescription: string, fileName: string): Promise<FileOutput> {
  console.log(`\n🔨 Building: ${fileName}`);

  const prompt = `Generate the complete ${fileDescription} file.

File: ${fileName}

Requirements:
- Full implementation, not a stub
- All imports at the top
- Proper error handling
- TypeScript strict mode
- Security best practices (parameterized queries, input validation)
- Comprehensive JSDoc comments

Return ONLY the file content, no explanations.`;

  try {
    const content = await generateWithOpenAI(prompt);
    console.log(`✅ Generated: ${fileName} (${content.length} chars)`);
    return { path: fileName, content };
  } catch (error: any) {
    console.error(`❌ Failed to generate ${fileName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('========================================');
  console.log('Real-Time Task Builder Agent');
  console.log('========================================\n');

  const files: FileOutput[] = [];

  try {
    // File 1: WebSocket Server
    files.push(await buildFile(
      'Socket.IO server with JWT auth, Redis pub/sub, multi-tenant isolation',
      'api/src/websocket/task-realtime.server.ts'
    ));

    // File 2: Presence Service
    files.push(await buildFile(
      'Presence tracking service (who\'s viewing each task)',
      'api/src/websocket/presence.service.ts'
    ));

    // File 3: Conflict Resolution
    files.push(await buildFile(
      'Conflict resolution using version vectors for optimistic UI',
      'api/src/websocket/conflict-resolution.service.ts'
    ));

    // File 4: Database Migration
    files.push(await buildFile(
      'SQL migration for websocket_events and task_presence tables',
      'api/migrations/020_websocket_events.sql'
    ));

    // File 5: React Hook
    files.push(await buildFile(
      'React hook (useRealtimeTasks) for subscribing to task updates',
      'src/hooks/useRealtimeTasks.ts'
    ));

    // Write all files
    console.log('\n========================================');
    console.log('Writing files to disk...');
    console.log('========================================\n');

    for (const file of files) {
      const fullPath = path.join('/home/azureuser/fleet-local', file.path);
      const dir = path.dirname(fullPath);

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, file.content, 'utf-8');

      console.log(`✅ Wrote: ${file.path}`);
    }

    console.log('\n========================================');
    console.log('Real-Time Task Builder - COMPLETE!');
    console.log('========================================');
    console.log(`✅ Generated ${files.length} files`);
    console.log('\nNext steps:');
    console.log('1. Review generated files');
    console.log('2. Run database migration: cd api && npm run migrate');
    console.log('3. Install dependencies: npm install socket.io redis ioredis zod');
    console.log('4. Start server: npm run dev');
    console.log('5. Test WebSocket: wscat -c ws://localhost:3000/tasks/realtime');

  } catch (error: any) {
    console.error('\n❌ Agent failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
