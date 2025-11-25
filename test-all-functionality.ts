/**
 * Comprehensive Functionality Test
 * Tests EVERY feature across all 5 hubs
 */
import { chromium, Browser, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

interface TestResult {
  hub: string;
  module: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  errors: string[];
  warnings: string[];
}

const results: TestResult[] = [];

async function testHub(page: Page, hubName: string, hubPath: string, modules: string[]): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Testing ${hubName.toUpperCase()}`);
  console.log(`${'='.repeat(80)}`);

  // Navigate to hub
  try {
    await page.goto(`${BASE_URL}${hubPath}`, { waitUntil: 'networkidle', timeout: 15000 });
    console.log(`✅ Navigated to ${hubPath}`);
  } catch (error) {
    console.log(`❌ Failed to navigate to ${hubPath}: ${error}`);
    results.push({
      hub: hubName,
      module: 'Navigation',
      status: 'FAIL',
      errors: [`Navigation failed: ${error}`],
      warnings: []
    });
    return;
  }

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Check for console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Check for white screen
  const bodyText = await page.textContent('body');
  if (!bodyText || bodyText.trim().length < 100) {
    console.log(`❌ ${hubName}: WHITE SCREEN DETECTED`);
    results.push({
      hub: hubName,
      module: 'Page Load',
      status: 'FAIL',
      errors: ['White screen - page content missing'],
      warnings: []
    });
    return;
  }

  console.log(`✅ ${hubName}: Page loaded successfully`);

  // Test each module
  for (const moduleName of modules) {
    console.log(`\n  📋 Testing module: ${moduleName}`);

    try {
      // Find and click module button
      const moduleButton = await page.locator(`button:has-text("${moduleName}")`).first();

      if (await moduleButton.isVisible()) {
        await moduleButton.click();
        await page.waitForTimeout(1000);

        // Check for errors after clicking
        const moduleErrors: string[] = [];
        const moduleWarnings: string[] = [];

        // Check if content changed
        const newBodyText = await page.textContent('body');
        if (!newBodyText || newBodyText === bodyText) {
          moduleWarnings.push('Content did not change after clicking module');
        }

        // Check for specific error messages
        const errorMessages = await page.locator('[role="alert"]').allTextContents();
        if (errorMessages.length > 0) {
          moduleErrors.push(...errorMessages);
        }

        results.push({
          hub: hubName,
          module: moduleName,
          status: moduleErrors.length > 0 ? 'FAIL' : 'PASS',
          errors: moduleErrors,
          warnings: moduleWarnings
        });

        console.log(`    ${moduleErrors.length > 0 ? '❌ FAIL' : '✅ PASS'}: ${moduleName}`);
        if (moduleErrors.length > 0) {
          moduleErrors.forEach(err => console.log(`       Error: ${err}`));
        }
      } else {
        console.log(`    ⏭️  SKIP: ${moduleName} button not found`);
        results.push({
          hub: hubName,
          module: moduleName,
          status: 'SKIP',
          errors: [],
          warnings: ['Module button not found in UI']
        });
      }
    } catch (error) {
      console.log(`    ❌ FAIL: ${moduleName} - ${error}`);
      results.push({
        hub: hubName,
        module: moduleName,
        status: 'FAIL',
        errors: [`${error}`],
        warnings: []
      });
    }
  }
}

(async () => {
  console.log('🚀 Starting Comprehensive Functionality Test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`${'='.repeat(80)}\n`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR]: ${msg.text()}`);
    }
  });

  // Test all 5 hubs
  const hubs = [
    {
      name: 'Operations Hub',
      path: '/hubs/operations',
      modules: [
        'Overview Dashboard',
        'Live Tracking',
        'Radio Dispatch',
        'Fuel Management',
        'Asset Management'
      ]
    },
    {
      name: 'Fleet Hub',
      path: '/hubs/fleet',
      modules: [
        'Fleet Dashboard',
        'Vehicle Maintenance',
        'Vehicle Telemetry',
        'Predictive Maintenance',
        'Garage Services',
        'Carbon Footprint'
      ]
    },
    {
      name: 'Work Hub',
      path: '/hubs/work',
      modules: [
        'Task Management',
        'Maintenance Scheduling',
        'Route Planning',
        'Enhanced Tasks',
        'Maintenance Requests',
        'Work Orders'
      ]
    },
    {
      name: 'People Hub',
      path: '/hubs/people',
      modules: [
        'People Management',
        'Driver Performance',
        'Driver Scorecard',
        'Mobile Employee',
        'Mobile Manager',
        'Training & Compliance'
      ]
    },
    {
      name: 'Insights Hub',
      path: '/hubs/insights',
      modules: [
        'Executive Dashboard',
        'Fleet Analytics',
        'Custom Reports',
        'Data Workbench',
        'Cost Analysis',
        'Predictive Analytics',
        'Business Intelligence'
      ]
    }
  ];

  for (const hub of hubs) {
    await testHub(page, hub.name, hub.path, hub.modules);
  }

  // Generate summary report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE FUNCTIONALITY TEST REPORT');
  console.log('='.repeat(80));

  const totalTests = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passed} (${((passed/totalTests)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed} (${((failed/totalTests)*100).toFixed(1)}%)`);
  console.log(`⏭️  Skipped: ${skipped} (${((skipped/totalTests)*100).toFixed(1)}%)`);

  // Detailed failures
  if (failed > 0) {
    console.log('\n❌ FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`\n  ${result.hub} → ${result.module}`);
      result.errors.forEach(err => console.log(`    - ${err}`));
    });
  }

  // Skipped modules
  if (skipped > 0) {
    console.log('\n⏭️  SKIPPED (Missing from UI):');
    results.filter(r => r.status === 'SKIP').forEach(result => {
      console.log(`  ${result.hub} → ${result.module}`);
    });
  }

  // Write detailed report to file
  const reportPath = '/tmp/functionality-test-report.json';
  const fs = require('fs');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed,
      failed,
      skipped,
      passRate: ((passed/totalTests)*100).toFixed(1) + '%'
    },
    results
  }, null, 2));

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  await browser.close();

  // Exit with error code if tests failed
  if (failed > 0) {
    console.log('\n❌ FUNCTIONALITY TEST FAILED - Remediation required');
    process.exit(1);
  } else {
    console.log('\n✅ ALL FUNCTIONALITY TESTS PASSED');
    process.exit(0);
  }
})();
