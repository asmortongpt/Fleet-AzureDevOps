import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('Deep Visual Analysis - MIT PhD Level', async ({ page }) => {
  const report: string[] = [];
  const consoleErrors: any[] = [];
  const networkFailures: any[] = [];
  const apiCalls: any[] = [];

  report.push('='.repeat(100));
  report.push('MIT PhD-LEVEL DEEP VISUAL ANALYSIS');
  report.push('Fleet App Rendering Issue Diagnosis');
  report.push('='.repeat(100));
  report.push('');

  // Capture console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      report.push(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  // Capture network
  page.on('requestfailed', request => {
    networkFailures.push({
      url: request.url(),
      method: request.method(),
      error: request.failure()?.errorText
    });
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('vehicles') || url.includes('data')) {
      apiCalls.push({
        url: url,
        status: response.status(),
        method: response.request().method()
      });
      report.push(`[API CALL] ${response.request().method()} ${url} - ${response.status()}`);
    }
  });

  report.push('PHASE 1: LOADING PRODUCTION URL');
  report.push('-'.repeat(100));

  await page.goto('https://fleet.capitaltechalliance.com', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  report.push(`✅ Page loaded: ${page.url()}`);
  report.push('');

  // Wait for React to mount
  await page.waitForTimeout(5000);

  report.push('PHASE 2: DOM STRUCTURE ANALYSIS');
  report.push('-'.repeat(100));

  const domAnalysis = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootExists: !!root,
      rootHTML: root?.innerHTML.substring(0, 1000) || '',
      rootChildren: root?.children.length || 0,
      bodyText: document.body.innerText.substring(0, 2000)
    };
  });

  report.push(`Root element: ${domAnalysis.rootExists ? '✅' : '❌'}`);
  report.push(`Root children: ${domAnalysis.rootChildren}`);
  report.push(`Body text length: ${domAnalysis.bodyText.length}`);
  report.push('');
  report.push('Body text preview:');
  report.push(domAnalysis.bodyText);
  report.push('');

  report.push('PHASE 3: REACT APP STATE');
  report.push('-'.repeat(100));

  const reactState = await page.evaluate(() => {
    // Check localStorage
    const ls = { ...localStorage };

    // Check if React rendered
    const hasReactRoot = !!document.querySelector('[data-reactroot]');

    // Count interactive elements
    const buttons = document.querySelectorAll('button').length;
    const inputs = document.querySelectorAll('input').length;
    const links = document.querySelectorAll('a').length;

    return {
      localStorage: ls,
      hasReactRoot,
      buttons,
      inputs,
      links
    };
  });

  report.push(`LocalStorage keys: ${Object.keys(reactState.localStorage).length}`);
  Object.entries(reactState.localStorage).forEach(([key, value]) => {
    const val = String(value);
    report.push(`  - ${key}: ${val.length > 100 ? val.substring(0, 100) + '...' : val}`);
  });
  report.push('');
  report.push(`React root: ${reactState.hasReactRoot ? '✅' : '❌'}`);
  report.push(`Buttons: ${reactState.buttons}`);
  report.push(`Inputs: ${reactState.inputs}`);
  report.push(`Links: ${reactState.links}`);
  report.push('');

  report.push('PHASE 4: DATA LOADING ANALYSIS');
  report.push('-'.repeat(100));

  const dataState = await page.evaluate(() => {
    // Check for vehicle data in the DOM
    const vehicleElements = document.querySelectorAll('[data-testid*="vehicle"], [class*="vehicle"]');

    // Check table rows
    const tableRows = document.querySelectorAll('table tbody tr').length;

    // Check for "no data" messages
    const bodyText = document.body.innerText.toLowerCase();
    const hasNoDataMessage = bodyText.includes('no vehicles') ||
                              bodyText.includes('no data') ||
                              bodyText.includes('0 vehicles') ||
                              bodyText.includes('0 total');

    // Check for loading states
    const hasLoadingSpinner = !!document.querySelector('[class*="spin"], [class*="load"]');

    return {
      vehicleElements: vehicleElements.length,
      tableRows,
      hasNoDataMessage,
      hasLoadingSpinner,
      bodyTextSample: document.body.innerText.substring(0, 500)
    };
  });

  report.push(`Vehicle elements found: ${dataState.vehicleElements}`);
  report.push(`Table rows: ${dataState.tableRows}`);
  report.push(`Has "no data" message: ${dataState.hasNoDataMessage ? '❌ YES' : '✅ NO'}`);
  report.push(`Has loading spinner: ${dataState.hasLoadingSpinner ? '⏳ YES' : '❌ NO'}`);
  report.push('');

  report.push('PHASE 5: API CALL SUMMARY');
  report.push('-'.repeat(100));

  if (apiCalls.length === 0) {
    report.push('❌ NO API CALLS DETECTED - Data not being fetched!');
  } else {
    report.push(`✅ ${apiCalls.length} API calls detected`);
    apiCalls.forEach(call => {
      const status = call.status === 200 ? '✅' : '❌';
      report.push(`  ${status} ${call.method} ${call.url} - ${call.status}`);
    });
  }
  report.push('');

  report.push('PHASE 6: ERROR SUMMARY');
  report.push('-'.repeat(100));

  if (consoleErrors.length > 0) {
    report.push(`❌ ${consoleErrors.length} console errors:`);
    consoleErrors.slice(0, 10).forEach((err, idx) => {
      report.push(`  ${idx + 1}. ${err.substring(0, 200)}`);
    });
  } else {
    report.push('✅ No console errors');
  }
  report.push('');

  if (networkFailures.length > 0) {
    report.push(`❌ ${networkFailures.length} network failures:`);
    networkFailures.forEach((failure, idx) => {
      report.push(`  ${idx + 1}. ${failure.method} ${failure.url} - ${failure.error}`);
    });
  } else {
    report.push('✅ No network failures');
  }
  report.push('');

  // Take screenshot
  await page.screenshot({ path: '/tmp/fleet-deep-analysis.png', fullPage: true });
  report.push('📸 Screenshot: /tmp/fleet-deep-analysis.png');
  report.push('');

  report.push('='.repeat(100));
  report.push('MIT PhD DIAGNOSIS');
  report.push('='.repeat(100));

  let diagnosis = '';
  let rootCause = '';

  if (apiCalls.length === 0) {
    rootCause = 'NO API CALLS BEING MADE';
    diagnosis = `The app is rendering the UI shell but NOT fetching any data.

Possible causes:
1. Demo mode check (VITE_USE_MOCK_DATA) is false, so app tries to call real API
2. Real API endpoints are not configured or not responding
3. Authentication/authorization blocking API calls
4. useEffect hooks not triggering data fetches
5. React Query/data fetching library not initialized

This explains why the app shows:
- 0 Total Vehicles
- Empty tables
- "No data" messages

The UI is working, but the data layer is broken.`;

  } else {
    const failedCalls = apiCalls.filter(c => c.status >= 400);
    if (failedCalls.length > 0) {
      rootCause = 'API CALLS FAILING';
      diagnosis = `The app IS making API calls, but they are failing:

Failed calls: ${failedCalls.length}/${apiCalls.length}

This could be:
1. 404 errors due to tenant_id bug (the original issue!)
2. 401/403 authentication errors
3. CORS errors
4. Backend not deployed or not accessible
5. Wrong API base URL configuration

Check the network tab in DevTools for specific error details.`;

    } else {
      rootCause = 'API CALLS SUCCESS BUT DATA NOT RENDERING';
      diagnosis = `The API calls are succeeding (200 OK) but data is not displaying.

This could be:
1. API returning empty arrays/objects
2. React state not updating after data fetch
3. Component rendering logic checking wrong conditions
4. TypeScript type mismatches causing silent failures
5. Data transformation/mapping errors

Need to check: What is the actual API response payload?`;
    }
  }

  report.push(`ROOT CAUSE: ${rootCause}`);
  report.push('');
  report.push(diagnosis);
  report.push('');
  report.push('='.repeat(100));

  // Save report
  const reportText = report.join('\n');
  fs.writeFileSync('/tmp/fleet-deep-analysis-report.txt', reportText);
  console.log(reportText);

  // Log summary
  console.log('\n' + '='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));
  console.log(`Root Cause: ${rootCause}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Network Failures: ${networkFailures.length}`);
  console.log(`API Calls: ${apiCalls.length}`);
  console.log(`Table Rows: ${dataState.tableRows}`);
  console.log(`Has No Data Message: ${dataState.hasNoDataMessage}`);
  console.log('='.repeat(100));
});
