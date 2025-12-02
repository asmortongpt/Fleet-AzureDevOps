#!/usr/bin/env node

/**
 * Manual Visual Regression Check
 *
 * Takes screenshots of key pages at different resolutions
 * and performs basic UI health checks
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../test-results/visual-manual');
const BASE_URL = process.env.APP_URL || 'http://localhost:5173';

const PAGES = [
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/' },
  { name: 'vehicles', path: '/vehicles' },
  { name: 'map', path: '/map' },
  { name: 'settings', path: '/settings' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

async function checkForIssues(page, pageName) {
  const issues = [];

  // Check for white screen
  const hasContent = await page.evaluate(() => {
    return document.body.innerText.trim().length > 0 && document.body.children.length > 1;
  });

  if (!hasContent) {
    issues.push('❌ White screen detected');
  }

  // Check for broken images
  const brokenImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.filter(img => !img.complete || img.naturalHeight === 0).length;
  });

  if (brokenImages > 0) {
    issues.push(`⚠️  ${brokenImages} broken image(s)`);
  }

  // Check for console errors
  const consoleLogs = await page.evaluate(() => {
    return (window.__errors__ || []).length;
  });

  if (consoleLogs > 0) {
    issues.push(`⚠️  ${consoleLogs} console error(s)`);
  }

  // Check for missing navigation
  const hasNav = await page.locator('nav, [role="navigation"], header').count() > 0;
  if (!hasNav) {
    issues.push('⚠️  No navigation found');
  }

  // Check for missing main content
  const hasMain = await page.locator('main, [role="main"]').count() > 0;
  if (!hasMain) {
    issues.push('⚠️  No main content area found');
  }

  return issues;
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
  console.log(`  📸 Screenshot saved: ${name}.png`);
  return screenshotPath;
}

async function runVisualCheck() {
  console.log('🎨 Starting Manual Visual Regression Check\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const results = {
    timestamp: new Date().toISOString(),
    pages: [],
    totalIssues: 0,
    screenshots: [],
  };

  try {
    for (const pageConfig of PAGES) {
      console.log(`\n📄 Testing: ${pageConfig.name} (${pageConfig.path})`);

      const pageResult = {
        name: pageConfig.name,
        path: pageConfig.path,
        viewports: [],
        issues: [],
      };

      for (const viewport of VIEWPORTS) {
        console.log(`  📐 Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        });

        // Track console errors
        context.on('console', msg => {
          if (msg.type() === 'error') {
            console.log(`    ⚠️  Console error: ${msg.text()}`);
          }
        });

        const page = await context.newPage();

        // Track errors
        await page.addInitScript(() => {
          window.__errors__ = [];
          window.addEventListener('error', (e) => {
            window.__errors__.push(e.message);
          });
        });

        try {
          // Navigate to page
          await page.goto(`${BASE_URL}${pageConfig.path}`, {
            waitUntil: 'networkidle',
            timeout: 15000,
          });

          // Wait for page to stabilize
          await page.waitForTimeout(2000);

          // Check for issues
          const issues = await checkForIssues(page, pageConfig.name);

          if (issues.length > 0) {
            console.log(`    Issues found:`);
            issues.forEach(issue => console.log(`      ${issue}`));
            pageResult.issues.push(...issues.map(i => `[${viewport.name}] ${i}`));
            results.totalIssues += issues.length;
          } else {
            console.log(`    ✅ No issues found`);
          }

          // Take screenshot
          const screenshotName = `${pageConfig.name}-${viewport.name}`;
          const screenshotPath = await takeScreenshot(page, screenshotName);
          results.screenshots.push(screenshotPath);

          pageResult.viewports.push({
            name: viewport.name,
            width: viewport.width,
            height: viewport.height,
            issues: issues.length,
            screenshot: screenshotName + '.png',
          });
        } catch (error) {
          console.log(`    ❌ Error: ${error.message}`);
          pageResult.issues.push(`[${viewport.name}] ${error.message}`);
          results.totalIssues++;
        }

        await context.close();
      }

      results.pages.push(pageResult);
    }
  } finally {
    await browser.close();
  }

  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('VISUAL REGRESSION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal Pages Tested: ${results.pages.length}`);
  console.log(`Total Viewports per Page: ${VIEWPORTS.length}`);
  console.log(`Total Screenshots: ${results.screenshots.length}`);
  console.log(`Total Issues Found: ${results.totalIssues}`);

  console.log('\n📊 Results by Page:');
  results.pages.forEach(page => {
    const pageIssues = page.issues.length;
    const status = pageIssues === 0 ? '✅ PASS' : `❌ FAIL (${pageIssues} issues)`;
    console.log(`  ${page.name}: ${status}`);
    if (pageIssues > 0) {
      page.issues.forEach(issue => console.log(`    - ${issue}`));
    }
  });

  // Save JSON results
  const resultsPath = path.join(OUTPUT_DIR, 'results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full results saved to: ${resultsPath}`);
  console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);

  // Final status
  if (results.totalIssues === 0) {
    console.log('\n✅ PASS: All visual regression checks passed!');
    process.exit(0);
  } else {
    console.log(`\n❌ FAIL: ${results.totalIssues} issue(s) found`);
    process.exit(1);
  }
}

// Run the check
runVisualCheck().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
