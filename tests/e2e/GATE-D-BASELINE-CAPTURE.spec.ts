import { test, expect, devices } from '@playwright/test';
import * as fs from 'fs';

/**
 * GATE D — BASELINE VISUAL + CONSOLE CAPTURE
 *
 * Captures screenshots at multiple viewports + console logs for ALL 16 working routes.
 * Evidence quotas: 2× screenshots per route (desktop + mobile), console logs, network failures.
 */

interface ViewportCapture {
  route: string;
  viewport: string;
  screenshotPath: string;
  consoleErrors: string[];
  consoleWarnings: string[];
  networkFailures: string[];
  timestamp: string;
}

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

const workingRoutes = [
  'Fleet Dashboard',
  'Executive Dashboard',
  'Admin Dashboard',
  'Dispatch Console',
  'Live GPS Tracking',
  'GIS Command Center',
  'Traffic Cameras',
  'Geofence Management',
  'Vehicle Telemetry',
  'Enhanced Map Layers',
  'Route Optimization',
  'People Management',
  'Garage & Service',
  'Virtual Garage 3D',
  'Predictive Maintenance',
  'Driver Performance'
];

test('GATE D — Baseline Visual + Console Capture', async ({ page, browser }) => {
  // Extend test timeout to 10 minutes for all viewports
  test.setTimeout(600000);

  const captures: ViewportCapture[] = [];
  const reportPath = '/tmp/GATE-D-BASELINE-REPORT.json';

  console.log('\n' + '='.repeat(80));
  console.log('GATE D — BASELINE VISUAL + CONSOLE CAPTURE');
  console.log('='.repeat(80));
  console.log(`Routes to capture: ${workingRoutes.length}`);
  console.log(`Viewports: ${viewports.length} (desktop, tablet, mobile)`);
  console.log(`Total captures: ${workingRoutes.length * viewports.length}`);
  console.log(`Test timeout: 600 seconds (10 minutes)`);
  console.log('='.repeat(80) + '\n');

  for (const viewport of viewports) {
    console.log(`\n${'━'.repeat(80)}`);
    console.log(`📱 VIEWPORT: ${viewport.name.toUpperCase()} (${viewport.width}×${viewport.height})`);
    console.log(`⏱️  Started at: ${new Date().toISOString()}`);
    console.log(`${'━'.repeat(80)}\n`);

    let context;
    let vPage;

    try {
      // Create new page with viewport and extended timeouts
      context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      vPage = await context.newPage();

      // Set longer timeouts for mobile viewport (may render slower)
      vPage.setDefaultTimeout(60000);
      vPage.setDefaultNavigationTimeout(60000);

    for (const route of workingRoutes) {
      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];
      const networkFailures: string[] = [];

      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📍 Capturing: ${route}`);
      console.log(`${'─'.repeat(80)}`);

      // Reset listeners
      vPage.removeAllListeners('console');
      vPage.removeAllListeners('response');

      // Capture console messages
      vPage.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('BillingNotEnabledMapError') && !text.includes('google.maps')) {
            consoleErrors.push(text);
          }
        } else if (msg.type() === 'warning') {
          const text = msg.text();
          if (!text.includes('google.maps') && !text.includes('deprecated')) {
            consoleWarnings.push(text);
          }
        }
      });

      // Capture network failures
      vPage.on('response', response => {
        if (response.status() >= 400 && response.status() !== 404) {
          networkFailures.push(`${response.status()} ${response.url()}`);
        }
      });

      try {
        // Navigate to app if first route
        if (workingRoutes.indexOf(route) === 0) {
          await vPage.goto('http://localhost:5174');
          await vPage.waitForLoadState('networkidle', { timeout: 30000 });
          await vPage.waitForTimeout(2000);
        }

        // Click navigation item with retry logic
        let retryCount = 0;
        const maxRetries = 2;
        while (retryCount <= maxRetries) {
          try {
            await vPage.click(`aside button:has-text("${route}")`);
            await vPage.waitForTimeout(1500);

            // Try networkidle first, fall back to domcontentloaded if it times out
            try {
              await vPage.waitForLoadState('networkidle', { timeout: 45000 });
            } catch (networkIdleError) {
              console.log(`   ⚠️  networkidle timeout, using domcontentloaded instead`);
              await vPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
              await vPage.waitForTimeout(3000); // Extra wait for heavy routes
            }
            break; // Success, exit retry loop
          } catch (clickError) {
            retryCount++;
            if (retryCount > maxRetries) {
              throw clickError;
            }
            console.log(`   🔄 Retry ${retryCount}/${maxRetries} for ${route}...`);
            await vPage.waitForTimeout(2000);
          }
        }

        // Take screenshot
        const screenshotFilename = `GATE-D-${viewport.name}-${route.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        const screenshotPath = `/tmp/${screenshotFilename}`;
        await vPage.screenshot({ path: screenshotPath, fullPage: false });

        console.log(`   ✅ Screenshot: ${screenshotFilename}`);
        console.log(`   📊 Errors: ${consoleErrors.length}, Warnings: ${consoleWarnings.length}, Network Failures: ${networkFailures.length}`);

        captures.push({
          route,
          viewport: viewport.name,
          screenshotPath,
          consoleErrors: [...new Set(consoleErrors)],
          consoleWarnings: [...new Set(consoleWarnings)],
          networkFailures: [...new Set(networkFailures)],
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.log(`   ❌ ERROR: ${error}`);
        captures.push({
          route,
          viewport: viewport.name,
          screenshotPath: '',
          consoleErrors: [`Failed to capture: ${error}`],
          consoleWarnings: [],
          networkFailures: [],
          timestamp: new Date().toISOString()
        });
      }
    }

    } catch (viewportError) {
      console.log(`\n❌ VIEWPORT ${viewport.name.toUpperCase()} FAILED: ${viewportError}`);
      console.log(`Continuing to next viewport...\n`);

      // Record failures for all routes in this viewport
      for (const route of workingRoutes) {
        captures.push({
          route,
          viewport: viewport.name,
          screenshotPath: '',
          consoleErrors: [`Viewport failed: ${viewportError}`],
          consoleWarnings: [],
          networkFailures: [],
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      // Always close context to prevent memory leaks
      if (context) {
        try {
          await context.close();
          console.log(`✅ Context closed for ${viewport.name} viewport`);
        } catch (closeError) {
          console.log(`⚠️  Warning: Failed to close context: ${closeError}`);
        }
      }
    }

    console.log(`⏱️  Completed at: ${new Date().toISOString()}`);
    console.log(`✅ ${viewport.name} viewport: ${captures.filter(c => c.viewport === viewport.name && c.screenshotPath).length}/${workingRoutes.length} captured\n`);
  }

  // Write comprehensive report
  fs.writeFileSync(reportPath, JSON.stringify(captures, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('GATE D COMPLETE — BASELINE CAPTURE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Captures: ${captures.length}`);
  console.log(`Successful: ${captures.filter(c => c.screenshotPath).length}`);
  console.log(`Failed: ${captures.filter(c => !c.screenshotPath).length}`);

  const totalErrors = captures.reduce((sum, c) => sum + c.consoleErrors.length, 0);
  const totalWarnings = captures.reduce((sum, c) => sum + c.consoleWarnings.length, 0);
  const totalNetworkFailures = captures.reduce((sum, c) => sum + c.networkFailures.length, 0);

  console.log(`\nConsole Errors: ${totalErrors}`);
  console.log(`Console Warnings: ${totalWarnings}`);
  console.log(`Network Failures (4xx/5xx): ${totalNetworkFailures}`);
  console.log(`\nReport saved: ${reportPath}`);
  console.log('='.repeat(80) + '\n');

  // Generate markdown summary
  const markdownReport = generateMarkdownReport(captures);
  fs.writeFileSync('/tmp/GATE-D-BASELINE-REPORT.md', markdownReport);
  console.log('📝 Markdown report: /tmp/GATE-D-BASELINE-REPORT.md\n');
});

function generateMarkdownReport(captures: ViewportCapture[]): string {
  let md = `# GATE D — BASELINE VISUAL + CONSOLE CAPTURE REPORT\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `**Total Captures:** ${captures.length}\n\n`;
  md += `---\n\n`;

  // Group by viewport
  viewports.forEach(viewport => {
    const vCaptures = captures.filter(c => c.viewport === viewport.name);
    md += `## ${viewport.name.toUpperCase()} Viewport (${viewport.width}×${viewport.height})\n\n`;
    md += `| Route | Screenshot | Errors | Warnings | Network Issues |\n`;
    md += `|-------|------------|--------|----------|----------------|\n`;

    vCaptures.forEach(cap => {
      const status = cap.screenshotPath ? '✅' : '❌';
      md += `| ${cap.route} | ${status} | ${cap.consoleErrors.length} | ${cap.consoleWarnings.length} | ${cap.networkFailures.length} |\n`;
    });

    md += `\n`;
  });

  // Console errors section
  md += `---\n\n## Console Errors by Route\n\n`;
  const routesWithErrors = captures.filter(c => c.consoleErrors.length > 0);
  if (routesWithErrors.length === 0) {
    md += `✅ No console errors detected across all routes and viewports!\n\n`;
  } else {
    routesWithErrors.forEach(cap => {
      md += `### ${cap.route} (${cap.viewport})\n\n`;
      cap.consoleErrors.forEach(err => {
        md += `- ${err.substring(0, 200)}\n`;
      });
      md += `\n`;
    });
  }

  return md;
}
