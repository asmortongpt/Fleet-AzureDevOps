#!/usr/bin/env tsx
/**
 * Targeted Feature Enhancer
 * Enhances ONLY 25 critical user-facing features
 * Cost: $3.75 vs $57 (93% savings!)
 */

import fs from 'fs/promises';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

const INDUSTRY_LEADING_TEMPLATE = `You are building a feature that EXCEEDS Samsara, Geotab, and Verizon Connect.

MANDATORY REQUIREMENTS:
1. SECURITY (Critical - Government/Enterprise):
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

3. PERFORMANCE:
   - Redis caching (5min - 1hr TTL)
   - Database query optimization (indexes, EXPLAIN ANALYZE)
   - CDN for static assets
   - Code splitting and lazy imports
   - 90+ Lighthouse score

4. MOBILE-FIRST RESPONSIVE:
   - TailwindCSS responsive utilities
   - Touch-friendly (44px+ tap targets)
   - Works offline (Progressive Web App)

5. ACCESSIBILITY (WCAG 2.1 AA):
   - Semantic HTML5
   - ARIA labels and roles
   - Keyboard navigation (Tab, Enter, Esc)
   - Color contrast >= 4.5:1

6. ERROR HANDLING:
   - Try/catch on ALL async operations
   - Exponential backoff retry (3 attempts)
   - User-friendly error messages
   - Logging to monitoring service

7. TYPESCRIPT STRICT MODE:
   - Full type coverage
   - No 'any' types
   - Zod schema validation

8. TESTING:
   - Unit tests (Vitest)
   - Integration tests
   - E2E tests (Playwright)

Generate COMPLETE, PRODUCTION-READY code. Return ONLY the enhanced code, no explanations.`;

// 25 Critical Features
const CRITICAL_FEATURES = [
  // Backend (15 files)
  '/home/azureuser/fleet-local/api/src/routes/auth.ts',
  '/home/azureuser/fleet-local/api/src/routes/users.ts',
  '/home/azureuser/fleet-local/api/src/routes/permissions.ts',
  '/home/azureuser/fleet-local/api/src/routes/vehicles.ts',
  '/home/azureuser/fleet-local/api/src/routes/trips.ts',
  '/home/azureuser/fleet-local/api/src/routes/maintenance.ts',
  '/home/azureuser/fleet-local/api/src/routes/drivers.ts',
  '/home/azureuser/fleet-local/api/src/routes/assets.ts',
  '/home/azureuser/fleet-local/api/src/routes/telemetry.ts',
  '/home/azureuser/fleet-local/api/src/routes/geofences.ts',
  '/home/azureuser/fleet-local/api/src/routes/alerts.ts',
  '/home/azureuser/fleet-local/api/src/routes/reports.ts',
  '/home/azureuser/fleet-local/api/src/routes/billing.ts',
  '/home/azureuser/fleet-local/api/src/routes/fuel.ts',
  '/home/azureuser/fleet-local/api/src/routes/inspections.ts',

  // Frontend (10 files)
  '/home/azureuser/fleet-local/src/pages/Dashboard.tsx',
  '/home/azureuser/fleet-local/src/components/maps/FleetMap.tsx',
  '/home/azureuser/fleet-local/src/components/vehicle/VehicleCard.tsx',
  '/home/azureuser/fleet-local/src/pages/vehicles/VehicleList.tsx',
  '/home/azureuser/fleet-local/src/pages/maintenance/MaintenanceSchedule.tsx',
  '/home/azureuser/fleet-local/src/components/trip/TripHistory.tsx',
  '/home/azureuser/fleet-local/src/pages/drivers/DriverManagement.tsx',
  '/home/azureuser/fleet-local/src/components/alerts/AlertPanel.tsx',
  '/home/azureuser/fleet-local/src/components/reports/ReportBuilder.tsx',
  '/home/azureuser/fleet-local/src/components/auth/LoginForm.tsx'
];

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enhanceWithOpenAI(file: string, content: string, attempt: number = 1): Promise<string> {
  try {
    console.log(`  🤖 OpenAI API call ${attempt}/${RETRY_ATTEMPTS}...`);

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
            content: `Enhance this ${path.basename(file)} to be INDUSTRY-LEADING:\n\n${content.slice(0, 3500)}\n\nReturn ONLY the enhanced code.`
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error(`Invalid response: ${JSON.stringify(data)}`);
    }

    return data.choices[0].message.content
      .replace(/^```typescript\n/g, '')
      .replace(/^```tsx\n/g, '')
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

async function enhanceFeature(file: string, index: number, total: number): Promise<void> {
  try {
    console.log(`\n[${index}/${total}] 🚀 Enhancing: ${path.basename(file)}`);

    // Check if file exists
    try {
      await fs.access(file);
    } catch {
      console.log(`  ⏭️  File not found, skipping`);
      return;
    }

    const content = await fs.readFile(file, 'utf-8');
    const enhanced = await enhanceWithOpenAI(file, content);

    const ext = path.extname(file);
    const outputPath = file.replace(ext, `.enhanced${ext}`);
    await fs.writeFile(outputPath, enhanced);

    console.log(`  ✅ Enhanced successfully`);
    console.log(`     Output: ${outputPath}`);

  } catch (error: any) {
    console.error(`  ❌ Failed: ${error.message}`);
  }
}

async function main() {
  console.log('========================================');
  console.log('Targeted Feature Enhancer');
  console.log('========================================\n');
  console.log(`Enhancing ${CRITICAL_FEATURES.length} critical features`);
  console.log(`Estimated cost: $${(CRITICAL_FEATURES.length * 0.15).toFixed(2)}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < CRITICAL_FEATURES.length; i++) {
    const file = CRITICAL_FEATURES[i];

    try {
      await enhanceFeature(file, i + 1, CRITICAL_FEATURES.length);
      successCount++;
    } catch (error) {
      failCount++;
    }

    // Rate limiting - 5 seconds between requests
    if (i < CRITICAL_FEATURES.length - 1) {
      console.log(`  ⏳ Waiting 5s before next request...`);
      await sleep(5000);
    }
  }

  console.log('\n========================================');
  console.log('Enhancement Complete!');
  console.log('========================================');
  console.log(`✅ Success: ${successCount}/${CRITICAL_FEATURES.length}`);
  console.log(`❌ Failed: ${failCount}/${CRITICAL_FEATURES.length}`);
  console.log(`💰 Actual cost: $${(successCount * 0.15).toFixed(2)}\n`);
}

main().catch(console.error);
