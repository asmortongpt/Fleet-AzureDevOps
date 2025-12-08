#!/usr/bin/env tsx
/**
 * Autonomous Docker Containerization Builder Agent
 * Builds production-ready Docker setup with multi-stage builds
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROJECT_ROOT = '/home/azureuser/fleet-local';

async function main() {
  console.log('========================================');
  console.log('Docker Builder - Starting');
  console.log('========================================\n');

  const tasks = [
    {
      name: 'Create API Dockerfile',
      file: `${PROJECT_ROOT}/api/Dockerfile`,
      prompt: `Create production Dockerfile for Node.js API:
- Multi-stage build (builder, production)
- Base: node:20-alpine
- Builder: install all deps, run TypeScript build
- Production: only production deps, copy dist/
- Non-root user (node)
- Health check on /api/health
- Expose port 3000
- Security: no secrets in layers, minimal attack surface.`
    },
    {
      name: 'Create docker-compose.yml',
      file: `${PROJECT_ROOT}/docker-compose.yml`,
      prompt: `Create docker-compose.yml for local development:
- Services: api, postgres, redis
- API: build from ./api/Dockerfile, port 3000, env from .env
- Postgres: postgres:15-alpine, persistent volume, port 5432
- Redis: redis:7-alpine, persistent volume, port 6379
- Networks: fleet-network (bridge)
- Volumes: postgres_data, redis_data
- Health checks for all services
Include restart policies, resource limits.`
    },
    {
      name: 'Create docker-compose.prod.yml',
      file: `${PROJECT_ROOT}/docker-compose.prod.yml`,
      prompt: `Create production docker-compose.yml:
- Extends base docker-compose.yml
- Use pre-built images from ACR (not build from source)
- Nginx reverse proxy (port 80/443)
- Let's Encrypt SSL certificates
- Replicas: 3 API instances for load balancing
- Production logging (JSON format to stdout)
- No exposed database ports (internal network only)
Include health checks, auto-restart policies.`
    },
    {
      name: 'Create .dockerignore',
      file: `${PROJECT_ROOT}/api/.dockerignore`,
      prompt: `Create .dockerignore for API:
- Exclude: node_modules, dist, .git, .env*, *.log
- Exclude: coverage, .vscode, .idea
- Exclude: *.md (except README.md)
- Include: package*.json, tsconfig.json, src/
Minimize image size, exclude sensitive files.`
    },
    {
      name: 'Create Docker build script',
      file: `${PROJECT_ROOT}/scripts/docker-build.sh`,
      prompt: `Create Docker build automation script:
- Build API image with tag (git SHA + timestamp)
- Push to Azure Container Registry (ACR)
- Tag as 'latest' if on main branch
- Include build args for version info
- Verify health check works before push
- Clean up dangling images
Use Azure CLI for ACR authentication, exit on any error.`
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
  console.log('Docker Builder - Complete!');
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
          content: 'You are an expert in Docker and DevOps. Generate production-ready Dockerfiles and docker-compose configurations following best practices: 1) Multi-stage builds, 2) Non-root users, 3) Minimal attack surface, 4) Health checks, 5) Proper security settings.'
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
