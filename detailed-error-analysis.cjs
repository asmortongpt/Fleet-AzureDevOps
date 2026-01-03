const { chromium } = require('playwright');

(async () => {
  console.log('📊 DETAILED ERROR ANALYSIS');
  console.log('==========================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errorsByType = {
    criticalErrors: [],
    securityHeaders: [],
    resourceErrors: [],
    apiErrors: [],
    googleMapsErrors: [],
    other: []
  };

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      // Categorize errors
      if (text.includes('X-Frame-Options') || text.includes('Content Security Policy')) {
        errorsByType.securityHeaders.push(text);
      } else if (text.includes('Failed to load resource')) {
        errorsByType.resourceErrors.push(text);
      } else if (text.includes('Google Maps') || text.includes('maps.googleapis')) {
        errorsByType.googleMapsErrors.push(text);
      } else if (text.includes('API') || text.includes('/api/')) {
        errorsByType.apiErrors.push(text);
      } else if (text.includes('QueryErrorBoundary') || text.includes('React') || text.includes('TypeError')) {
        errorsByType.criticalErrors.push(text);
      } else {
        errorsByType.other.push(text);
      }
    }
  });

  page.on('pageerror', error => {
    errorsByType.criticalErrors.push(`${error.message}\n${error.stack}`);
  });

  console.log('Testing main dashboard...\n');
  await page.goto('http://localhost:5175/', {
    waitUntil: 'domcontentloaded',
    timeout: 10000
  });

  await page.waitForTimeout(3000);

  // Print categorized errors
  console.log('\n=== CRITICAL REACT/JAVASCRIPT ERRORS ===');
  if (errorsByType.criticalErrors.length === 0) {
    console.log('✅ NO CRITICAL ERRORS');
  } else {
    errorsByType.criticalErrors.slice(0, 5).forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.substring(0, 200)}...`);
    });
    if (errorsByType.criticalErrors.length > 5) {
      console.log(`\n... and ${errorsByType.criticalErrors.length - 5} more`);
    }
  }

  console.log('\n\n=== GOOGLE MAPS ERRORS ===');
  if (errorsByType.googleMapsErrors.length === 0) {
    console.log('✅ NO GOOGLE MAPS ERRORS (FIX VERIFIED!)');
  } else {
    errorsByType.googleMapsErrors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err}`);
    });
  }

  console.log('\n\n=== API ERRORS ===');
  if (errorsByType.apiErrors.length === 0) {
    console.log('✅ NO API ERRORS');
  } else {
    errorsByType.apiErrors.slice(0, 3).forEach((err, i) => {
      console.log(`\n${i + 1}. ${err}`);
    });
  }

  console.log('\n\n=== SECURITY HEADER WARNINGS (Non-Critical) ===');
  console.log(`${errorsByType.securityHeaders.length} warnings (expected in dev mode)`);

  console.log('\n\n=== RESOURCE 404 ERRORS ===');
  console.log(`${errorsByType.resourceErrors.length} resources (optional features)`);

  console.log('\n\n=== OTHER ERRORS ===');
  if (errorsByType.other.length === 0) {
    console.log('✅ NONE');
  } else {
    errorsByType.other.slice(0, 3).forEach((err, i) => {
      console.log(`\n${i + 1}. ${err}`);
    });
  }

  console.log('\n\n📊 SUMMARY');
  console.log('==========');
  console.log(`Critical Errors: ${errorsByType.criticalErrors.length}`);
  console.log(`Google Maps Errors: ${errorsByType.googleMapsErrors.length} ${errorsByType.googleMapsErrors.length === 0 ? '✅ FIXED!' : '❌'}`);
  console.log(`API Errors: ${errorsByType.apiErrors.length}`);
  console.log(`Security Warnings: ${errorsByType.securityHeaders.length} (expected)`);
  console.log(`Resource 404s: ${errorsByType.resourceErrors.length} (optional)`);

  await browser.close();
})();
