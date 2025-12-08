#!/usr/bin/env tsx
/**
 * Autonomous SSO Backend Builder Agent
 * Builds complete Azure AD OAuth SSO login backend
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
  console.log('SSO Backend Builder Agent - Starting');
  console.log('========================================\n');

  const tasks = [
    {
      name: 'Create Azure AD OAuth routes',
      file: `${API_DIR}/src/routes/auth/azure-ad.ts`,
      prompt: `Create complete Azure AD OAuth routes with:
- /api/auth/azure/login - Initiate OAuth flow
- /api/auth/azure/callback - Handle OAuth callback
- /api/auth/azure/logout - Clear session
- /api/auth/me - Get current user
Use environment variables for config, implement JWT tokens, parameterized SQL queries only.`
    },
    {
      name: 'Create Azure AD service layer',
      file: `${API_DIR}/src/services/auth/azure-ad.service.ts`,
      prompt: `Create Azure AD service with:
- Token exchange logic
- User profile fetching from Microsoft Graph
- Session management
- JWT token generation (RS256)
Use @azure/msal-node for OAuth, secure token storage.`
    },
    {
      name: 'Create JWT validation middleware',
      file: `${API_DIR}/src/middleware/azure-ad-auth.ts`,
      prompt: `Create JWT validation middleware:
- Extract JWT from Authorization header
- Verify signature using public key
- Validate expiration
- Attach user to request object
Return 401 for invalid tokens, use jsonwebtoken library.`
    }
  ];

  for (const task of tasks) {
    console.log(`\n[TASK] ${task.name}`);
    console.log(`[FILE] ${task.file}`);

    // Create directory if needed
    const dir = path.dirname(task.file);
    await fs.mkdir(dir, { recursive: true });

    // Generate code using OpenAI
    const code = await generateCode(task.prompt);

    // Write file
    await fs.writeFile(task.file, code);
    console.log(`✅ Created: ${task.file}`);
  }

  console.log('\n========================================');
  console.log('SSO Backend Builder Agent - Complete!');
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
