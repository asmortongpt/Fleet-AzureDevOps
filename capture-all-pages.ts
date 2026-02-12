import fs from 'fs';
import path from 'path';

import { chromium, Page } from '@playwright/test';

const APP_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = './screenshots';

// All routes to capture
const routes = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/auth/callback', name: 'auth-callback' },
  { path: '/403', name: '403-forbidden' },
  { path: '/profile', name: 'profile' },
  { path: '/settings', name: 'settings' },

  // Hub Pages
  { path: '/command-center', name: 'command-center' },
  { path: '/fleet', name: 'fleet-hub' },
  { path: '/operations', name: 'operations-hub' },
  { path: '/analytics', name: 'analytics-hub' },
  { path: '/maintenance', name: 'maintenance-hub' },
  { path: '/drivers', name: 'drivers-hub' },
  { path: '/safety', name: 'safety-hub' },
  { path: '/financial', name: 'financial-hub' },
  { path: '/admin', name: 'admin-dashboard' },
  { path: '/admin-config', name: 'admin-config' },
  { path: '/assets', name: 'assets-hub' },
  { path: '/communication', name: 'communication-hub' },
  { path: '/compliance', name: 'compliance-hub' },
  { path: '/configuration', name: 'configuration-hub' },
  { path: '/cta-configuration', name: 'cta-configuration-hub' },
  { path: '/data-governance', name: 'data-governance-hub' },
  { path: '/documents', name: 'documents-hub' },
  { path: '/integrations', name: 'integrations-hub' },
  { path: '/policy', name: 'policy-hub' },
  { path: '/procurement', name: 'procurement-hub' },
  { path: '/reports', name: 'reports-hub' },
  { path: '/safety-compliance', name: 'safety-compliance-hub' },

  // Feature Pages
  { path: '/analytics-workbench', name: 'analytics-workbench' },
  { path: '/cost-analytics', name: 'cost-analytics' },
  { path: '/drilldown-demo', name: 'drilldown-demo' },
  { path: '/fleet-design-demo', name: 'fleet-design-demo' },
  { path: '/heavy-equipment', name: 'heavy-equipment' },
  { path: '/module-admin', name: 'module-admin' },
  { path: '/safety-alerts', name: 'safety-alerts' },
  { path: '/personal-use', name: 'personal-use-dashboard' },
  { path: '/personal-use/charges', name: 'charges-billing' },
  { path: '/personal-use/reimbursement', name: 'reimbursement-queue' },
  { path: '/radio', name: 'radio-dispatch' },
];

interface PageAnalysis {
  name: string;
  path: string;
  timestamp: string;
  viewport: { width: number; height: number };
  screenshots: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
  accessibility: {
    missingAltTexts: number;
    missingAriaLabels: number;
    headingStructure: string[];
    formLabels: { total: number; missing: number };
    contrastIssues: number;
  };
  performance: {
    loadTime: number;
    domContentLoaded: number;
    resourceCount: number;
  };
  errors: {
    console: string[];
    network: string[];
  };
  interactive: {
    buttons: number;
    links: number;
    forms: number;
    inputs: number;
  };
}

async function analyzeAccessibility(page: Page): Promise<PageAnalysis['accessibility']> {
  return await page.evaluate(() => {
    const results = {
      missingAltTexts: 0,
      missingAriaLabels: 0,
      headingStructure: [] as string[],
      formLabels: { total: 0, missing: 0 },
      contrastIssues: 0,
    };

    // Check images without alt text
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && img.role !== 'presentation') {
        results.missingAltTexts++;
      }
    });

    // Check interactive elements without ARIA labels
    const interactive = document.querySelectorAll('button, a, [role="button"], [onclick]');
    interactive.forEach(el => {
      const hasLabel = el.getAttribute('aria-label') ||
                      el.getAttribute('aria-labelledby') ||
                      el.textContent?.trim();
      if (!hasLabel) {
        results.missingAriaLabels++;
      }
    });

    // Check heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(h => {
      results.headingStructure.push(`${h.tagName}: ${h.textContent?.slice(0, 50)}`);
    });

    // Check form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    results.formLabels.total = inputs.length;
    inputs.forEach(input => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
      if (!hasLabel && !hasAriaLabel) {
        results.formLabels.missing++;
      }
    });

    return results;
  });
}

async function analyzeInteractivity(page: Page): Promise<PageAnalysis['interactive']> {
  return await page.evaluate(() => {
    return {
      buttons: document.querySelectorAll('button, [role="button"]').length,
      links: document.querySelectorAll('a[href]').length,
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input, select, textarea').length,
    };
  });
}

async function capturePageScreenshots(
  page: Page,
  route: typeof routes[0],
  dir: string
): Promise<PageAnalysis> {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Listen for network errors
  page.on('requestfailed', request => {
    networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log(`\n📸 Capturing: ${route.name} (${route.path})`);

  const startTime = Date.now();
  let domContentLoadedTime = 0;

  page.on('domcontentloaded', () => {
    domContentLoadedTime = Date.now() - startTime;
  });

  // Navigate to page
  try {
    await page.goto(`${APP_URL}${route.path}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
  } catch (error) {
    console.error(`  ❌ Failed to load: ${error}`);
    throw error;
  }

  const loadTime = Date.now() - startTime;

  // Wait for page to be fully rendered
  await page.waitForTimeout(2000);

  const screenshots = {
    desktop: '',
    tablet: '',
    mobile: '',
  };

  // Desktop screenshot (1920x1080)
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);
  const desktopPath = path.join(dir, `${route.name}-desktop.png`);
  await page.screenshot({ path: desktopPath, fullPage: true });
  screenshots.desktop = desktopPath;
  console.log(`  ✓ Desktop: ${desktopPath}`);

  // Tablet screenshot (768x1024)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  const tabletPath = path.join(dir, `${route.name}-tablet.png`);
  await page.screenshot({ path: tabletPath, fullPage: true });
  screenshots.tablet = tabletPath;
  console.log(`  ✓ Tablet: ${tabletPath}`);

  // Mobile screenshot (375x667)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  const mobilePath = path.join(dir, `${route.name}-mobile.png`);
  await page.screenshot({ path: mobilePath, fullPage: true });
  screenshots.mobile = mobilePath;
  console.log(`  ✓ Mobile: ${mobilePath}`);

  // Reset to desktop for analysis
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Analyze page
  const accessibility = await analyzeAccessibility(page);
  const interactive = await analyzeInteractivity(page);
  const resourceCount = await page.evaluate(() => performance.getEntriesByType('resource').length);

  console.log(`  📊 Analysis:`);
  console.log(`    - Load time: ${loadTime}ms`);
  console.log(`    - Missing alt texts: ${accessibility.missingAltTexts}`);
  console.log(`    - Missing ARIA labels: ${accessibility.missingAriaLabels}`);
  console.log(`    - Console errors: ${consoleErrors.length}`);
  console.log(`    - Network errors: ${networkErrors.length}`);

  return {
    name: route.name,
    path: route.path,
    timestamp: new Date().toISOString(),
    viewport: { width: 1920, height: 1080 },
    screenshots,
    accessibility,
    performance: {
      loadTime,
      domContentLoaded: domContentLoadedTime,
      resourceCount,
    },
    errors: {
      console: consoleErrors,
      network: networkErrors,
    },
    interactive,
  };
}

async function main() {
  console.log('🚀 Fleet Management App - Screenshot Capture & Analysis\n');
  console.log(`📍 App URL: ${APP_URL}`);
  console.log(`📁 Screenshot directory: ${SCREENSHOT_DIR}\n`);

  // Create screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  const analyses: PageAnalysis[] = [];

  // Capture all routes
  for (const route of routes) {
    try {
      const analysis = await capturePageScreenshots(page, route, SCREENSHOT_DIR);
      analyses.push(analysis);
    } catch (error) {
      console.error(`  ⚠️  Skipping ${route.name} due to error`);
      analyses.push({
        name: route.name,
        path: route.path,
        timestamp: new Date().toISOString(),
        viewport: { width: 1920, height: 1080 },
        screenshots: { desktop: '', tablet: '', mobile: '' },
        accessibility: {
          missingAltTexts: 0,
          missingAriaLabels: 0,
          headingStructure: [],
          formLabels: { total: 0, missing: 0 },
          contrastIssues: 0,
        },
        performance: { loadTime: 0, domContentLoaded: 0, resourceCount: 0 },
        errors: { console: [`Failed to load: ${error}`], network: [] },
        interactive: { buttons: 0, links: 0, forms: 0, inputs: 0 },
      });
    }
  }

  await browser.close();

  // Generate report
  const report = generateReport(analyses);
  const reportPath = path.join(SCREENSHOT_DIR, 'analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Analysis report saved: ${reportPath}`);

  const summaryPath = path.join(SCREENSHOT_DIR, 'SUMMARY.md');
  fs.writeFileSync(summaryPath, generateMarkdownSummary(report));
  console.log(`📄 Summary report saved: ${summaryPath}`);

  console.log('\n✅ Screenshot capture complete!');
  console.log(`\n📊 Summary:`);
  console.log(`  - Total pages: ${analyses.length}`);
  console.log(`  - Successful: ${analyses.filter(a => a.screenshots.desktop).length}`);
  console.log(`  - Failed: ${analyses.filter(a => !a.screenshots.desktop).length}`);
  console.log(`  - Screenshots: ${analyses.length * 3}`);
}

function generateReport(analyses: PageAnalysis[]) {
  return {
    timestamp: new Date().toISOString(),
    totalPages: analyses.length,
    summary: {
      avgLoadTime: Math.round(analyses.reduce((sum, a) => sum + a.performance.loadTime, 0) / analyses.length),
      totalAccessibilityIssues: analyses.reduce((sum, a) =>
        sum + a.accessibility.missingAltTexts + a.accessibility.missingAriaLabels, 0
      ),
      totalConsoleErrors: analyses.reduce((sum, a) => sum + a.errors.console.length, 0),
      totalNetworkErrors: analyses.reduce((sum, a) => sum + a.errors.network.length, 0),
    },
    pages: analyses,
  };
}

function generateMarkdownSummary(report: ReturnType<typeof generateReport>): string {
  return `# Fleet Management App - Screenshot Analysis Report

Generated: ${new Date().toISOString()}

## Overview

- **Total Pages Analyzed:** ${report.totalPages}
- **Average Load Time:** ${report.summary.avgLoadTime}ms
- **Total Accessibility Issues:** ${report.summary.totalAccessibilityIssues}
- **Total Console Errors:** ${report.summary.totalConsoleErrors}
- **Total Network Errors:** ${report.summary.totalNetworkErrors}

## Page Analysis

${report.pages.map(page => `
### ${page.name}

- **Path:** \`${page.path}\`
- **Load Time:** ${page.performance.loadTime}ms
- **DOM Content Loaded:** ${page.performance.domContentLoaded}ms
- **Resources Loaded:** ${page.performance.resourceCount}

**Accessibility Issues:**
- Missing Alt Texts: ${page.accessibility.missingAltTexts}
- Missing ARIA Labels: ${page.accessibility.missingAriaLabels}
- Form Labels Missing: ${page.accessibility.formLabels.missing}/${page.accessibility.formLabels.total}

**Interactive Elements:**
- Buttons: ${page.interactive.buttons}
- Links: ${page.interactive.links}
- Forms: ${page.interactive.forms}
- Inputs: ${page.interactive.inputs}

**Errors:**
- Console Errors: ${page.errors.console.length}
- Network Errors: ${page.errors.network.length}

**Screenshots:**
- Desktop: \`${page.screenshots.desktop}\`
- Tablet: \`${page.screenshots.tablet}\`
- Mobile: \`${page.screenshots.mobile}\`

${page.errors.console.length > 0 ? `**Console Errors:**
\`\`\`
${page.errors.console.join('\n')}
\`\`\`
` : ''}

${page.errors.network.length > 0 ? `**Network Errors:**
\`\`\`
${page.errors.network.join('\n')}
\`\`\`
` : ''}
`).join('\n---\n')}

## Recommendations

### High Priority
${report.pages
  .filter(p => p.accessibility.missingAriaLabels > 5)
  .map(p => `- **${p.name}**: ${p.accessibility.missingAriaLabels} missing ARIA labels`)
  .join('\n') || '- None'}

### Medium Priority
${report.pages
  .filter(p => p.accessibility.missingAltTexts > 0)
  .map(p => `- **${p.name}**: ${p.accessibility.missingAltTexts} missing alt texts`)
  .join('\n') || '- None'}

### Performance Issues
${report.pages
  .filter(p => p.performance.loadTime > 3000)
  .map(p => `- **${p.name}**: ${p.performance.loadTime}ms load time`)
  .join('\n') || '- None'}
`;
}

main().catch(console.error);
