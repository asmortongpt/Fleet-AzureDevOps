import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Fleet App Visual Inspection - Root Cause Analysis', () => {
  test('Comprehensive visual and technical inspection', async ({ page }) => {
    const report: string[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];
    const networkIssues: any[] = [];

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      report.push(`[CONSOLE ${msg.type().toUpperCase()}] ${text}`);

      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: text, timestamp: new Date().toISOString() });
      } else if (msg.type() === 'warning') {
        warnings.push({ type: 'console', message: text, timestamp: new Date().toISOString() });
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      const errorMsg = `${error.name}: ${error.message}\n${error.stack}`;
      report.push(`[PAGE ERROR] ${errorMsg}`);
      errors.push({
        type: 'page',
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Capture network failures
    page.on('requestfailed', request => {
      const failure = `${request.url()} - ${request.failure()?.errorText}`;
      report.push(`[NETWORK FAIL] ${failure}`);
      networkIssues.push({
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      });
    });

    report.push('='.repeat(80));
    report.push('FLEET APP VISUAL INSPECTION - ROOT CAUSE ANALYSIS');
    report.push('='.repeat(80));
    report.push('');

    // Navigate to production
    report.push('1. LOADING PRODUCTION URL');
    report.push('-'.repeat(40));

    try {
      const response = await page.goto('https://fleet.capitaltechalliance.com', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      report.push(`Status: ${response?.status()}`);
      report.push(`URL: ${page.url()}`);
      report.push(`Title: ${await page.title()}`);
      report.push('');

      // Take initial screenshot
      await page.screenshot({ path: '/tmp/fleet-initial-load.png', fullPage: true });
      report.push('Screenshot saved: /tmp/fleet-initial-load.png');
      report.push('');

    } catch (error: any) {
      report.push(`CRITICAL: Failed to load page - ${error.message}`);
      errors.push({ type: 'navigation', message: error.message, timestamp: new Date().toISOString() });
    }

    // Wait a bit for any lazy-loaded content
    await page.waitForTimeout(3000);

    report.push('2. DOM STRUCTURE ANALYSIS');
    report.push('-'.repeat(40));

    // Check if React root rendered
    const rootElement = await page.locator('#root').count();
    report.push(`React root element (#root): ${rootElement > 0 ? '✅ Found' : '❌ Missing'}`);

    // Check for common error patterns
    const hasWhiteScreen = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return true;
      const children = root.children.length;
      const hasContent = root.textContent && root.textContent.trim().length > 0;
      return children === 0 && !hasContent;
    });
    report.push(`White screen detected: ${hasWhiteScreen ? '❌ YES' : '✅ NO'}`);

    // Check for error boundaries
    const errorBoundaryText = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase();
      return {
        hasErrorBoundary: body.includes('something went wrong') || body.includes('error boundary'),
        hasChunkLoadError: body.includes('chunk') || body.includes('dynamically imported module'),
        hasNetworkError: body.includes('network error') || body.includes('failed to fetch')
      };
    });

    report.push(`Error boundary triggered: ${errorBoundaryText.hasErrorBoundary ? '❌ YES' : '✅ NO'}`);
    report.push(`Chunk load error: ${errorBoundaryText.hasChunkLoadError ? '❌ YES' : '✅ NO'}`);
    report.push(`Network error: ${errorBoundaryText.hasNetworkError ? '❌ YES' : '✅ NO'}`);
    report.push('');

    // Get actual DOM content
    const bodyContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        innerHTML: root?.innerHTML.substring(0, 1000) || 'ROOT NOT FOUND',
        childCount: root?.children.length || 0,
        textContent: root?.textContent?.substring(0, 500) || ''
      };
    });

    report.push(`Root child elements: ${bodyContent.childCount}`);
    report.push(`Root text content preview: ${bodyContent.textContent.substring(0, 200)}...`);
    report.push('');

    report.push('3. JAVASCRIPT BUNDLE ANALYSIS');
    report.push('-'.repeat(40));

    // Check loaded scripts
    const scripts = await page.evaluate(() => {
      return Array.from(document.scripts).map(script => ({
        src: script.src,
        async: script.async,
        defer: script.defer,
        type: script.type,
        loaded: script.readyState || 'unknown'
      }));
    });

    report.push(`Total scripts loaded: ${scripts.length}`);
    scripts.forEach(script => {
      if (script.src) {
        const filename = script.src.split('/').pop();
        report.push(`  - ${filename} (type: ${script.type})`);
      }
    });
    report.push('');

    // Check for specific bundle
    const hasExpectedBundle = scripts.some(s => s.src.includes('index-D4LZrSGe.js'));
    const hasOldBundle = scripts.some(s => s.src.includes('index-DgzbfjTU.js'));

    report.push(`Expected bundle (index-D4LZrSGe.js): ${hasExpectedBundle ? '✅ Found' : '❌ Missing'}`);
    report.push(`Old bundle (index-DgzbfjTU.js): ${hasOldBundle ? '⚠️  Found (should be gone)' : '✅ Not found'}`);
    report.push('');

    report.push('4. CSS LOADING ANALYSIS');
    report.push('-'.repeat(40));

    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(sheet => ({
        href: sheet.href,
        rules: sheet.cssRules?.length || 0
      }));
    });

    report.push(`Total stylesheets loaded: ${stylesheets.length}`);
    stylesheets.forEach(sheet => {
      if (sheet.href) {
        const filename = sheet.href.split('/').pop();
        report.push(`  - ${filename} (${sheet.rules} rules)`);
      }
    });
    report.push('');

    report.push('5. REACT RENDERING STATE');
    report.push('-'.repeat(40));

    const reactState = await page.evaluate(() => {
      // Check for React DevTools markers
      const hasReact = !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const hasReactRoot = document.querySelector('[data-reactroot]') !== null;

      // Check for common React hydration issues
      const suspenseFallbacks = document.querySelectorAll('[data-suspense-fallback]').length;

      return {
        hasReact,
        hasReactRoot,
        suspenseFallbacks
      };
    });

    report.push(`React DevTools hook: ${reactState.hasReact ? '✅ Found' : '❌ Missing'}`);
    report.push(`React root rendered: ${reactState.hasReactRoot ? '✅ Yes' : '❌ No'}`);
    report.push(`Suspense fallbacks: ${reactState.suspenseFallbacks}`);
    report.push('');

    report.push('6. LOCAL STORAGE & SESSION STATE');
    report.push('-'.repeat(40));

    const storageData = await page.evaluate(() => {
      const ls = { ...localStorage };
      const ss = { ...sessionStorage };
      return { localStorage: ls, sessionStorage: ss };
    });

    report.push(`LocalStorage keys: ${Object.keys(storageData.localStorage).length}`);
    Object.keys(storageData.localStorage).forEach(key => {
      const value = storageData.localStorage[key];
      const preview = value.length > 50 ? value.substring(0, 50) + '...' : value;
      report.push(`  - ${key}: ${preview}`);
    });
    report.push('');

    report.push('7. NETWORK ACTIVITY');
    report.push('-'.repeat(40));

    // Get all network requests
    const requests = await page.evaluate(() => {
      return (window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]).map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        transferSize: entry.transferSize,
        status: 'unknown' // Can't get status from Performance API
      }));
    });

    report.push(`Total network requests: ${requests.length}`);

    // Group by type
    const byType = requests.reduce((acc: any, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {});

    report.push(`Request breakdown:`);
    Object.entries(byType).forEach(([type, count]) => {
      report.push(`  - ${type}: ${count}`);
    });
    report.push('');

    // Check for failed API calls
    const apiCalls = requests.filter(r => r.name.includes('/api/'));
    report.push(`API calls detected: ${apiCalls.length}`);
    apiCalls.forEach(call => {
      const url = new URL(call.name);
      report.push(`  - ${url.pathname}${url.search}`);
    });
    report.push('');

    report.push('8. VIEWPORT & LAYOUT METRICS');
    report.push('-'.repeat(40));

    const metrics = await page.evaluate(() => {
      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        document: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        },
        body: {
          width: document.body.scrollWidth,
          height: document.body.scrollHeight
        }
      };
    });

    report.push(`Viewport: ${metrics.viewport.width}x${metrics.viewport.height}`);
    report.push(`Document: ${metrics.document.width}x${metrics.document.height}`);
    report.push(`Body: ${metrics.body.width}x${metrics.body.height}`);
    report.push('');

    report.push('9. ERROR SUMMARY');
    report.push('-'.repeat(40));

    if (errors.length === 0) {
      report.push('✅ No JavaScript errors detected');
    } else {
      report.push(`❌ ${errors.length} error(s) detected:`);
      errors.forEach((err, idx) => {
        report.push(`\nError ${idx + 1}:`);
        report.push(`  Type: ${err.type}`);
        report.push(`  Message: ${err.message}`);
        if (err.stack) {
          report.push(`  Stack: ${err.stack.substring(0, 200)}...`);
        }
      });
    }
    report.push('');

    if (warnings.length > 0) {
      report.push(`⚠️  ${warnings.length} warning(s) detected:`);
      warnings.slice(0, 5).forEach((warn, idx) => {
        report.push(`  ${idx + 1}. ${warn.message.substring(0, 100)}`);
      });
      report.push('');
    }

    if (networkIssues.length > 0) {
      report.push(`🌐 ${networkIssues.length} network issue(s) detected:`);
      networkIssues.forEach((issue, idx) => {
        report.push(`  ${idx + 1}. ${issue.url} - ${issue.error}`);
      });
      report.push('');
    }

    report.push('10. ROOT CAUSE ANALYSIS');
    report.push('='.repeat(80));

    // Determine root cause
    let rootCause = 'UNKNOWN';
    let recommendation = '';

    if (hasOldBundle && !hasExpectedBundle) {
      rootCause = 'CDN CACHE - OLD BUNDLE STILL SERVED';
      recommendation = `The production URL is still serving the old bundle (index-DgzbfjTU.js) instead of the new bundle (index-D4LZrSGe.js). This is a CDN caching issue. Azure Front Door cache has not fully propagated yet.

IMMEDIATE ACTION:
1. Wait 5-10 more minutes for cache propagation
2. Test directly at: https://gray-flower-03a2a730f.3.azurestaticapps.net
3. Force cache purge again if needed

VERIFICATION:
curl -s https://fleet.capitaltechalliance.com | grep 'index-.*\\.js'`;
    } else if (errors.length > 0) {
      rootCause = 'JAVASCRIPT RUNTIME ERROR';
      recommendation = `JavaScript errors are preventing the app from rendering. Most common causes:
1. Module import errors (chunk loading failures)
2. React hydration mismatches
3. API initialization errors
4. Missing dependencies

Check the error details above for specific stack traces.`;
    } else if (hasWhiteScreen && bodyContent.childCount === 0) {
      rootCause = 'REACT APP FAILED TO MOUNT';
      recommendation = `The React app failed to mount to the DOM. Possible causes:
1. JavaScript bundle failed to load
2. React initialization error (silent failure)
3. Router configuration issue
4. Missing root element ID mismatch

Check browser DevTools Console for additional errors.`;
    } else if (networkIssues.length > 0) {
      rootCause = 'NETWORK RESOURCE LOADING FAILURE';
      recommendation = `Network resources failed to load. This could be:
1. CORS issues
2. Missing static assets
3. CDN routing problems
4. SSL certificate issues`;
    } else {
      rootCause = 'APP APPEARS TO BE LOADING CORRECTLY';
      recommendation = 'No obvious rendering issues detected. The app may be functioning but with UI/UX issues. Check for:
1. CSS not loading
2. Data not populating
3. Specific component failures
4. Authentication/authorization blocks';
    }

    report.push(`ROOT CAUSE: ${rootCause}`);
    report.push('');
    report.push('RECOMMENDATION:');
    report.push(recommendation);
    report.push('');
    report.push('='.repeat(80));

    // Save report
    const reportPath = '/tmp/fleet-visual-inspection-report.txt';
    fs.writeFileSync(reportPath, report.join('\n'));
    console.log(`\n📄 Full report saved to: ${reportPath}\n`);

    // Save detailed JSON for further analysis
    const detailedReport = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      rootCause,
      recommendation,
      errors,
      warnings,
      networkIssues,
      dom: bodyContent,
      scripts,
      stylesheets,
      reactState,
      metrics,
      storageData
    };

    fs.writeFileSync('/tmp/fleet-inspection-detailed.json', JSON.stringify(detailedReport, null, 2));
    console.log('📊 Detailed JSON saved to: /tmp/fleet-inspection-detailed.json\n');

    // Output summary to console
    console.log('\n' + '='.repeat(80));
    console.log('VISUAL INSPECTION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Root Cause: ${rootCause}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Network Issues: ${networkIssues.length}`);
    console.log(`Expected Bundle Present: ${hasExpectedBundle ? 'YES' : 'NO'}`);
    console.log(`Old Bundle Present: ${hasOldBundle ? 'YES (PROBLEM)' : 'NO'}`);
    console.log('='.repeat(80) + '\n');

    // Test should fail if root cause found
    expect(rootCause).toBe('APP APPEARS TO BE LOADING CORRECTLY');
  });
});
