#!/usr/bin/env node
/**
 * Grok Agent for Fleet Management UI Redesign
 * Executes on Azure VM - Single autonomous agent with definitive UI vision
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = {
  API_KEY: process.env.GROK_API_KEY || process.env.XAI_API_KEY || '',
  REPO_PATH: '/root/fleet-azuredevops',
  OUTPUT_DIR: '/root/fleet-azuredevops/src',
  MODEL: 'grok-beta'
};

const UI_VISION = `
DEFINITIVE "CORRECT UI" VISION

Core Principles (Non-Negotiable):
1. One primary control surface, not many semi-dashboards
2. Users never choose where to go before understanding what matters
3. UI communicates system state before configuration
4. Every page answers exactly one dominant question
5. No pages whose sole purpose is CRUD
6. Navigation reflects decisions and outcomes, not data models
7. Screens must change understanding or enable action

Design Philosophy:
- State Before Structure: Show what's happening before how it's organized
- One Mental Model: Command center, not tool collection
- Compression Over Expansion: tabs > pages, panels > navigation
- Evidence, Not Assertions: Show WHY, not just status
- Design for Escalation: Normal/Degradation/Failure/Action Required
- UI Must Never Lie: Explicit failures, no silent degradation

Required Sections:
🟦 DASHBOARD: "Is Fleet working, and what matters right now?"
🟩 OPERATIONS: "What actions can I take right now?"
🟨 ANALYTICS: "What changed, when, and why should I care?"
🟥 ADMIN: "How do I change the system without breaking it?"
🟪 INTEGRATIONS: "Why is something not working?"
`;

const COMPONENTS = [
  {
    name: 'Dashboard Command Center',
    file: 'pages/DashboardCommand.tsx',
    question: '🟦 Is Fleet working, and what matters right now?',
    prompt: `${UI_VISION}

Create DashboardCommand.tsx - The ONLY landing page.

Requirements:
- Global system health (0-100% gradient, NOT binary)
- Active issues requiring attention (hierarchical escalation)
- Recent interpreted activity (NOT raw logs)
- Top 5 signals explaining current state
- Health trends with direction arrows
- Time context: 5m/1h/24h tabs

Forbidden:
- Raw tables
- Configuration forms
- Deep links without context

Technical Stack:
- React 18 + TypeScript
- React Query: GET /api/dashboard/stats
- Auto-refresh: every 30 seconds
- Recharts for trend visualization
- Skeleton loaders for async states
- Error boundaries

Return ONLY production-ready TypeScript React component code. No explanations, no TODOs.`
  },
  {
    name: 'Operations Command Hub',
    file: 'pages/OperationsCommand.tsx',
    question: '🟩 What actions can I take right now?',
    prompt: `${UI_VISION}

Create OperationsCommand.tsx - Unified operations control surface.

Design Pattern:
- Split view: 40% list (virtualized), 60% detail panel
- Tabs: Vehicles | Drivers | Routes | Maintenance
- Inline actions: expand → act → confirm → return
- NO navigation loss, NO "edit pages"

Features:
- @tanstack/react-virtual for 10,000+ items
- React Query mutations with optimistic updates
- Keyboard navigation: j/k to move, Enter to select
- Live search/filter without page reload
- Status indicators with color escalation

APIs:
- GET /api/vehicles
- GET /api/drivers
- GET /api/routes
- GET /api/maintenance

Return ONLY production-ready TypeScript React component code. No placeholders.`
  },
  {
    name: 'Analytics Visualization',
    file: 'pages/AnalyticsViz.tsx',
    question: '🟨 What changed, when, and why should I care?',
    prompt: `${UI_VISION}

Create AnalyticsViz.tsx - Visual-first analytics dashboard.

Structure:
- Question-first layout (headers as questions)
- Visual first, numbers second
- Annotations baked into charts (not separate legends)
- Time range selector: 24h | 7d | 30d | 90d

Required Charts:
1. Fleet utilization trend (line chart with event annotations)
2. Cost breakdown by category (donut chart with percentages)
3. Maintenance forecast (bar chart with targets)
4. Efficiency over time (area chart with comparison bands)
5. Top 5 cost drivers (horizontal bar with deltas)

Forbidden:
- Static reports
- CSV-shaped tables
- "Select metric" dropdowns as primary interaction

Technical:
- Recharts responsive charts
- Hover tooltips with detailed context
- GET /api/analytics/overview
- Auto-refresh every 5 minutes

Return ONLY production-ready TypeScript React component code.`
  },
  {
    name: 'Admin Control Panel',
    file: 'pages/AdminControl.tsx',
    question: '🟥 How do I change the system without breaking it?',
    prompt: `${UI_VISION}

Create AdminControl.tsx - Safe configuration management.

Hard Requirements:
- Settings grouped by impact: Low | Medium | High | CRITICAL
- Dangerous actions in red border + warning icon
- Inline validation BEFORE save
- Configuration health always visible
- Progressive disclosure (show only what's needed)

Sections:
1. System Configuration (impact-sorted)
2. User Management (RBAC controls)
3. Integrations Control Plane (unified)
4. Danger Zone (destructive actions, isolated)

Safety Guards:
- Real-time validation with error messages
- Optimistic updates with automatic rollback on failure
- Confirm dangerous actions: type "CONFIRM" to proceed
- Show config diff before applying changes
- Audit log all configuration changes

Technical:
- react-hook-form for validation
- React Query mutations
- GET /api/admin/config
- POST /api/admin/config with validation

Return ONLY production-ready TypeScript React component code.`
  },
  {
    name: 'Integrations Truth Surface',
    file: 'pages/IntegrationsTruth.tsx',
    question: '🟪 Why is something not working?',
    prompt: `${UI_VISION}

Create IntegrationsTruth.tsx - Diagnostic truth surface.

Must Show:
- Live connectivity status (real-time, NOT cached)
- Last successful interaction timestamp
- Required vs optional configuration
- Explicit failure reasons (NEVER "Unknown error")
- Response time metrics (p50, p95, p99)
- Quick diagnostic steps & remediation

Services to Monitor:
- PostgreSQL database
- Redis cache
- Google Maps API
- External APIs
- WebSocket connections
- Background job queues

Health Indicators:
🟢 Healthy: <200ms, 100% success rate
🟡 Degraded: 200-1000ms OR 95-99% success
🔴 Failed: >1000ms OR <95% success
⚫ Unknown: No data in last 5 minutes

Technical:
- Health checks every 10 seconds (WebSocket)
- Response time histogram
- Error logs with full stack traces
- One-click retry for failed services
- GET /api/integrations/health

Return ONLY production-ready TypeScript React component code.`
  }
];

async function callGrok(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are a senior full-stack engineer specializing in production-grade React/TypeScript. Write complete, working code. No placeholders. No TODOs. No comments explaining what should be done - DO IT. Use proper TypeScript types, modern React patterns (hooks, suspense), and production error handling.'
        },
        { role: 'user', content: prompt }
      ],
      model: CONFIG.MODEL,
      temperature: 0.2,
      max_tokens: 8000
    });

    const options = {
      hostname: 'api.x.ai',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices?.[0]?.message?.content) {
            resolve(parsed.choices[0].message.content);
          } else {
            reject(new Error(`Invalid Grok response: ${JSON.stringify(parsed)}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function extractCode(response) {
  const match = response.match(/```(?:typescript|tsx|jsx)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : response;
}

async function generateComponent(component) {
  console.log(`\n${'='.repeat(75)}`);
  console.log(`🤖 GROK AGENT: ${component.name}`);
  console.log(`📝 ${component.question}`);
  console.log(`📁 ${component.file}`);
  console.log('='.repeat(75));

  try {
    console.log('⏳ Calling Grok API...');
    const response = await callGrok(component.prompt);
    console.log(`✅ Response received (${response.length} chars)`);

    const code = extractCode(response);
    const filePath = path.join(CONFIG.OUTPUT_DIR, component.file);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`💾 Saved: ${filePath}`);
    console.log(`📊 Size: ${code.length} characters`);

    return {
      success: true,
      component: component.name,
      file: component.file,
      size: code.length
    };
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
    return {
      success: false,
      component: component.name,
      error: error.message
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(75));
  console.log('🚀 GROK AGENT: FLEET MANAGEMENT UI REDESIGN');
  console.log('📋 Mission: Implement Definitive "Correct UI" Vision');
  console.log('='.repeat(75));
  console.log(`\n📦 Repository: ${CONFIG.REPO_PATH}`);
  console.log(`🤖 Components: ${COMPONENTS.length}`);
  console.log(`⚡ Model: ${CONFIG.MODEL}`);
  console.log(`🔑 API Key: ${CONFIG.API_KEY.substring(0, 20)}...`);
  console.log('');

  const results = [];
  const startTime = Date.now();

  for (const component of COMPONENTS) {
    const result = await generateComponent(component);
    results.push(result);

    // Rate limiting: wait 3 seconds between API calls
    if (component !== COMPONENTS[COMPONENTS.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  console.log('\n' + '='.repeat(75));
  console.log('📊 EXECUTION SUMMARY');
  console.log('='.repeat(75));
  console.log(`⏱️  Total Duration: ${duration} seconds`);
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  console.log('\n📁 Generated Files:');
  results.forEach(r => {
    if (r.success) {
      console.log(`  ✅ ${r.file} (${r.size.toLocaleString()} chars)`);
    } else {
      console.log(`  ❌ ${r.component} - ${r.error}`);
    }
  });

  // Save execution report
  const reportPath = path.join(CONFIG.REPO_PATH, 'GROK_UI_REDESIGN_REPORT.json');
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    model: CONFIG.MODEL,
    vision: UI_VISION,
    results: results
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`\n📄 Report: ${reportPath}`);
  console.log('\n' + '='.repeat(75));
  console.log(successful === results.length ? '🎉 ALL COMPONENTS GENERATED SUCCESSFULLY' : '⚠️  PARTIAL SUCCESS');
  console.log('='.repeat(75) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR:', err);
  process.exit(1);
});
