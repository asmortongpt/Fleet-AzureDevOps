import { chromium } from 'playwright';

console.log('🚀 COMPREHENSIVE FLEET SYSTEM TEST');
console.log('=' .repeat(60));
console.log('');

const results = {
  api: {},
  routes: {},
  errors: [],
  warnings: []
};

// Test API Endpoints
console.log('📡 TESTING API ENDPOINTS');
console.log('-'.repeat(60));

const apiEndpoints = [
  '/api/vehicles',
  '/api/drivers',
  '/api/facilities',
  '/api/work-orders',
  '/api/fuel-transactions'
];

for (const endpoint of apiEndpoints) {
  try {
    const response = await fetch(`http://localhost:3001${endpoint}`);
    const data = await response.json();

    const count = Array.isArray(data) ? data.length : (data.data?.length || 0);
    results.api[endpoint] = {
      status: response.status,
      count: count,
      success: response.ok
    };

    console.log(`✅ ${endpoint.padEnd(30)} - ${response.status} (${count} items)`);
  } catch (error) {
    results.api[endpoint] = { error: error.message, success: false };
    console.log(`❌ ${endpoint.padEnd(30)} - ERROR: ${error.message}`);
  }
}

console.log('');
console.log('🌐 TESTING FRONTEND ROUTES');
console.log('-'.repeat(60));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errorLogs = [];
const warnLogs = [];

page.on('console', msg => {
  if (msg.type() === 'error') errorLogs.push(msg.text());
  if (msg.type() === 'warning') warnLogs.push(msg.text());
});

page.on('pageerror', error => {
  results.errors.push({
    message: error.message,
    stack: error.stack
  });
});

const routes = [
  { path: '/', name: 'Home Dashboard' },
  { path: '/vehicles', name: 'Vehicles' },
  { path: '/drivers', name: 'Drivers' },
  { path: '/maintenance', name: 'Maintenance' },
  { path: '/analytics', name: 'Analytics (FIXED)' },
  { path: '/compliance', name: 'Compliance' },
  { path: '/fleet', name: 'Fleet Dashboard' }
];

for (const route of routes) {
  try {
    const response = await page.goto(`http://localhost:5175${route.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.waitForTimeout(2000);

    const errorBoundary = await page.locator('text=/error occurred/i').count();
    const hasContent = await page.locator('body').count() > 0;

    results.routes[route.path] = {
      status: response.status(),
      errorBoundary: errorBoundary > 0,
      hasContent: hasContent,
      success: response.ok && errorBoundary === 0
    };

    const icon = errorBoundary > 0 ? '❌' : '✅';
    const status = errorBoundary > 0 ? 'ERROR BOUNDARY' : 'OK';
    console.log(`${icon} ${route.name.padEnd(25)} - ${status}`);
  } catch (error) {
    results.routes[route.path] = { error: error.message, success: false };
    console.log(`❌ ${route.name.padEnd(25)} - ERROR: ${error.message.substring(0, 50)}`);
  }
}

await browser.close();

console.log('');
console.log('=' .repeat(60));
console.log('📊 COMPREHENSIVE TEST SUMMARY');
console.log('=' .repeat(60));
console.log('');

// API Summary
const apiSuccess = Object.values(results.api).filter(r => r.success).length;
const apiTotal = Object.keys(results.api).length;
console.log(`API Endpoints:     ${apiSuccess}/${apiTotal} passing (${Math.round(apiSuccess/apiTotal*100)}%)`);

// Routes Summary
const routesSuccess = Object.values(results.routes).filter(r => r.success).length;
const routesTotal = Object.keys(results.routes).length;
console.log(`Frontend Routes:   ${routesSuccess}/${routesTotal} passing (${Math.round(routesSuccess/routesTotal*100)}%)`);

// Error Boundaries
const errorBoundaries = Object.values(results.routes).filter(r => r.errorBoundary).length;
console.log(`Error Boundaries:  ${errorBoundaries} triggered`);

// JavaScript Errors
console.log(`JavaScript Errors: ${results.errors.length} critical`);
console.log(`Console Warnings:  ${warnLogs.length} warnings`);

console.log('');
if (apiSuccess === apiTotal && routesSuccess === routesTotal && errorBoundaries === 0) {
  console.log('🎉 ALL SYSTEMS OPERATIONAL - 100% SUCCESS RATE');
} else {
  console.log('⚠️  Some issues detected - review details above');
}
console.log('=' .repeat(60));
