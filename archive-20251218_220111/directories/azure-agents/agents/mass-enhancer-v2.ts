#!/usr/bin/env tsx
/**
 * Mass Feature Enhancement Agent V2
 * Robust version with better error handling
 * Processes ALL features to make EVERYTHING industry-leading
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const BATCH_SIZE = 5; // Process 5 features at a time (reduced for stability)
const PARALLEL_WORKERS = 3; // 3 concurrent workers (reduced for stability)
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds between retries

const INDUSTRY_LEADING_TEMPLATE = `You are building a feature that EXCEEDS Samsara, Geotab, and Verizon Connect.

MANDATORY REQUIREMENTS:
1. SECURITY (Critical - Government/Enterprise System):
   - ONLY parameterized SQL: pool.query('SELECT * FROM x WHERE id = $1', [id])
   - NEVER string concatenation in SQL
   - JWT RS256 with public key validation
   - Bcrypt passwords (cost >= 12)
   - Input validation (whitelist everything)
   - Output escaping for XSS prevention
   - Rate limiting (100 req/min per user)
   - HTTPS only, Helmet security headers
   - CSRF tokens on all mutations

2. REAL-TIME CAPABILITIES:
   - WebSocket server for live updates
   - Server-Sent Events (SSE) fallback
   - Optimistic UI updates
   - Automatic reconnection logic
   - Presence detection
   - Live collaboration cursors

3. PERFORMANCE:
   - Redis caching (5min - 1hr TTL)
   - Database query optimization (indexes, EXPLAIN ANALYZE)
   - CDN for static assets
   - Image optimization (WebP, lazy loading)
   - Code splitting and lazy imports
   - Service Worker for offline capability
   - 90+ Lighthouse score

4. MOBILE-FIRST RESPONSIVE:
   - TailwindCSS responsive utilities
   - Touch-friendly (44px+ tap targets)
   - Gesture support (swipe, pinch-zoom)
   - Native mobile feel
   - Works offline (Progressive Web App)

5. ACCESSIBILITY (WCAG 2.1 AA):
   - Semantic HTML5
   - ARIA labels and roles
   - Keyboard navigation (Tab, Enter, Esc)
   - Screen reader tested
   - Color contrast >= 4.5:1
   - Focus indicators
   - Skip navigation links

6. ERROR HANDLING:
   - Try/catch on ALL async operations
   - Exponential backoff retry (3 attempts)
   - User-friendly error messages
   - Error boundary components
   - Logging to monitoring service
   - Graceful degradation

7. TYPESCRIPT STRICT MODE:
   - Full type coverage
   - No 'any' types
   - Zod schema validation
   - Type guards for runtime checks

8. TESTING:
   - Unit tests (Vitest)
   - Integration tests
   - E2E tests (Playwright)
   - 80%+ code coverage

Generate COMPLETE, PRODUCTION-READY code that industry analysts would rate as "best-in-class".
Return ONLY the enhanced code, no explanations or markdown wrappers.`;

interface EnhancementJob {
  file: string;
  content: string;
  priority: number;
}

async function findAllFeatures(): Promise<string[]> {
  const files: string[] = [];

  const searchPaths = [
    '/home/azureuser/fleet-local/api/src/routes',
    '/home/azureuser/fleet-local/src/components',
    '/home/azureuser/fleet-local/src/pages'
  ];

  for (const searchPath of searchPaths) {
    try {
      const { stdout } = await execAsync(`find ${searchPath} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) 2>/dev/null || true`);
      const foundFiles = stdout.trim().split('\n').filter(Boolean);
      files.push(...foundFiles);
    } catch (error) {
      console.error(`⚠️  Error searching ${searchPath}:`, error);
    }
  }

  return files;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enhanceWithOpenAI(file: string, content: string, attempt: number = 1): Promise<string> {
  try {
    console.log(`  🤖 Calling OpenAI API (attempt ${attempt}/${RETRY_ATTEMPTS})...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: INDUSTRY_LEADING_TEMPLATE },
          {
            role: 'user',
            content: `Enhance this ${path.basename(file)} to be INDUSTRY-LEADING:\n\n${content.slice(0, 3000)}\n\nReturn ONLY the enhanced code.`
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error(`Invalid OpenAI response structure: ${JSON.stringify(data)}`);
    }

    const enhancedCode = data.choices[0].message.content;

    // Clean up markdown wrappers if present
    return enhancedCode
      .replace(/^```typescript\n/g, '')
      .replace(/^```tsx\n/g, '')
      .replace(/^```javascript\n/g, '')
      .replace(/^```jsx\n/g, '')
      .replace(/\n```$/g, '');

  } catch (error: any) {
    if (attempt < RETRY_ATTEMPTS) {
      console.log(`  ⏳ Retry in ${RETRY_DELAY/1000}s...`);
      await sleep(RETRY_DELAY);
      return enhanceWithOpenAI(file, content, attempt + 1);
    }
    throw error;
  }
}

async function enhanceWithClaude(file: string, content: string, attempt: number = 1): Promise<string> {
  try {
    console.log(`  🧠 Calling Claude API (attempt ${attempt}/${RETRY_ATTEMPTS})...`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: `${INDUSTRY_LEADING_TEMPLATE}

File: ${path.basename(file)}
Current Code:
\`\`\`
${content.slice(0, 4000)}
\`\`\`

Enhance this to be INDUSTRY-LEADING. Return ONLY the complete enhanced code, no explanations.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error(`Invalid Claude response structure: ${JSON.stringify(data)}`);
    }

    return data.content[0].text;

  } catch (error: any) {
    if (attempt < RETRY_ATTEMPTS) {
      console.log(`  ⏳ Retry in ${RETRY_DELAY/1000}s...`);
      await sleep(RETRY_DELAY);
      return enhanceWithClaude(file, content, attempt + 1);
    }
    throw error;
  }
}

async function enhanceFeature(file: string): Promise<void> {
  try {
    const content = await fs.readFile(file, 'utf-8');

    // Skip if already enhanced
    if (file.includes('.enhanced.')) {
      console.log(`⏭️  Skipped (already enhanced): ${path.basename(file)}`);
      return;
    }

    // Skip test files for now to save API calls
    if (file.includes('.test.') || file.includes('.spec.')) {
      console.log(`⏭️  Skipped (test file): ${path.basename(file)}`);
      return;
    }

    // Use OpenAI ONLY (Claude credits depleted)
    let enhanced: string;
    if (OPENAI_API_KEY) {
      enhanced = await enhanceWithOpenAI(file, content);
    } else {
      throw new Error('No OpenAI API key available');
    }

    // Write enhanced version
    const ext = path.extname(file);
    const outputPath = file.replace(ext, `.enhanced${ext}`);
    await fs.writeFile(outputPath, enhanced);

    console.log(`✅ Enhanced: ${path.basename(file)}`);
    console.log(`   Output: ${outputPath}`);

  } catch (error: any) {
    console.error(`❌ Failed ${path.basename(file)}: ${error.message}`);
  }
}

async function processWorker(jobs: EnhancementJob[], workerId: number): Promise<void> {
  console.log(`\n🚀 Worker ${workerId} starting with ${jobs.length} jobs\n`);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`\n[Worker ${workerId}] Processing ${i + 1}/${jobs.length}: ${path.basename(job.file)}`);

    await enhanceFeature(job.file);

    // Rate limiting - 5 seconds between requests per worker
    if (i < jobs.length - 1) {
      console.log(`  ⏳ Waiting 5s before next request...`);
      await sleep(5000);
    }
  }

  console.log(`\n✅ Worker ${workerId} completed all ${jobs.length} jobs\n`);
}

async function main() {
  console.log('========================================');
  console.log('Mass Feature Enhancement V2 - Starting');
  console.log('========================================\n');

  const allFiles = await findAllFeatures();
  console.log(`\n📊 Found ${allFiles.length} total features\n`);

  // Prioritize: Backend routes > Components > Pages
  const jobs: EnhancementJob[] = allFiles.map(file => ({
    file,
    content: '',
    priority: file.includes('/routes/') ? 1 : file.includes('/components/') ? 2 : 3
  })).sort((a, b) => a.priority - b.priority);

  // Split into batches for parallel workers
  const batches: EnhancementJob[][] = [];
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    batches.push(jobs.slice(i, i + BATCH_SIZE));
  }

  console.log(`\n🚀 Processing ${batches.length} batches with ${PARALLEL_WORKERS} workers\n`);

  // Process in parallel
  const workerPromises: Promise<void>[] = [];
  for (let i = 0; i < PARALLEL_WORKERS; i++) {
    const workerBatches = batches.filter((_, idx) => idx % PARALLEL_WORKERS === i);
    const workerJobs = workerBatches.flat();
    workerPromises.push(processWorker(workerJobs, i));
  }

  await Promise.all(workerPromises);

  console.log('\n========================================');
  console.log('Mass Enhancement V2 Complete!');
  console.log('========================================\n');

  // Count enhanced files
  const enhancedFiles = await execAsync(`find /home/azureuser/fleet-local -name "*.enhanced.*" | wc -l`);
  console.log(`✅ ${enhancedFiles.stdout.trim()} features enhanced to industry-leading standards\n`);
}

main().catch(console.error);
