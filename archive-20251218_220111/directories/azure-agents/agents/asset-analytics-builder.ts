#!/usr/bin/env tsx
/**
 * Asset Analytics Builder Agent
 * Builds advanced asset utilization and ROI analytics system
 */

import fs from 'fs/promises';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are an expert data engineer and business intelligence specialist.

Create a COMPLETE, PRODUCTION-READY asset analytics system with these EXACT requirements:

## MANDATORY REQUIREMENTS:

### 1. SECURITY (Critical - Government/Enterprise):
- JWT RS256 authentication
- Parameterized SQL queries ONLY
- RBAC: Only managers can view cost data
- Multi-tenant isolation
- Audit log all report generations
- Rate limiting: 20 reports/hour per user

### 2. ANALYTICS FEATURES:
- Utilization Metrics:
  * Daily utilization percentage (active hours / 24 * 100)
  * Idle time alerts (assets idle >7 days)
  * Heatmap data (hourly usage patterns)
  * Compare to industry benchmarks

- ROI Calculation:
  * Total Cost of Ownership = Purchase + Maintenance + Fuel + Insurance
  * Cost per Mile = Total Costs / Total Miles
  * Payback Period = Investment / (Annual Revenue - Annual Costs)
  * Depreciation tracking

- Reporting:
  * CSV export (daily/weekly/monthly)
  * PDF report generation with charts
  * Email scheduled reports (cron)
  * Real-time dashboard via WebSocket

### 3. PERFORMANCE:
- Materialized views refreshed daily
- Indexed queries (<100ms p95)
- Aggregate 90 days of data in <500ms
- Use window functions for moving averages
- Partition tables by month
- Cache dashboard data (5min TTL)

### 4. ERROR HANDLING:
- Try/catch on ALL async operations
- Retry failed queries (3 attempts)
- User-friendly error messages
- Comprehensive logging

### 5. TYPESCRIPT STRICT MODE:
- Full type coverage
- No 'any' types
- Zod schema validation
- Exported TypeScript interfaces

### 6. DATABASE OPTIMIZATION:
- Create materialized views: vw_asset_daily_utilization, vw_asset_roi_summary
- Use PostgreSQL window functions
- Create indexes on frequently queried columns
- Partition large tables by month

Generate COMPLETE files (not snippets):
1. api/src/routes/asset-analytics.routes.ts (Analytics endpoints)
2. api/src/services/utilization-calc.service.ts (Utilization calculations)
3. api/src/services/roi-calculator.service.ts (ROI formulas)
4. api/src/workers/daily-metrics.worker.ts (Cron job for materialized view refresh)
5. api/migrations/022_asset_utilization_views.sql (Database schema + views)
6. src/components/analytics/UtilizationDashboard.tsx (React dashboard)

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
- Performance optimizations (caching, indexing)
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
  console.log('Asset Analytics Builder Agent');
  console.log('========================================\n');

  const files: FileOutput[] = [];

  try {
    // File 1: Analytics Routes
    files.push(await buildFile(
      'API routes for asset utilization, ROI, idle assets, cost-per-mile analytics',
      'api/src/routes/asset-analytics.routes.ts'
    ));

    // File 2: Utilization Calculator
    files.push(await buildFile(
      'Utilization calculation service (percentage, idle time, heatmaps)',
      'api/src/services/utilization-calc.service.ts'
    ));

    // File 3: ROI Calculator
    files.push(await buildFile(
      'ROI calculation service (TCO, payback period, cost-per-mile)',
      'api/src/services/roi-calculator.service.ts'
    ));

    // File 4: Daily Metrics Worker
    files.push(await buildFile(
      'Cron worker to refresh materialized views daily at 2 AM',
      'api/src/workers/daily-metrics.worker.ts'
    ));

    // File 5: Database Migration
    files.push(await buildFile(
      'SQL migration for materialized views (vw_asset_daily_utilization, vw_asset_roi_summary) with refresh function',
      'api/migrations/022_asset_utilization_views.sql'
    ));

    // File 6: React Dashboard
    files.push(await buildFile(
      'React dashboard component with charts (utilization heatmap, ROI bar chart, idle assets table)',
      'src/components/analytics/UtilizationDashboard.tsx'
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
    console.log('Asset Analytics Builder - COMPLETE!');
    console.log('========================================');
    console.log(`✅ Generated ${files.length} files`);
    console.log('\nNext steps:');
    console.log('1. Review generated files');
    console.log('2. Run database migration: cd api && npm run migrate');
    console.log('3. Install dependencies: npm install pdfkit fast-csv node-cron recharts');
    console.log('4. Start daily cron: node api/src/workers/daily-metrics.worker.ts');
    console.log('5. Test analytics: curl http://localhost:3000/api/assets/analytics/utilization');

  } catch (error: any) {
    console.error('\n❌ Agent failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
