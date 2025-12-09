import { test, expect } from '@playwright/test';

/**
 * PDCA LOOP 1 — VERIFICATION TEST
 * Verify GIS Command Center TypeError fix
 */

test('PDCA LOOP 1 — Verify GIS Command Center loads without TypeError', async ({ page }) => {
  const consoleErrors: string[] = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Only capture actual errors, not suppressed Google Maps errors
      if (!text.includes('BillingNotEnabledMapError') && !text.includes('google.maps')) {
        consoleErrors.push(text);
      }
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('PDCA LOOP 1 — VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log('Issue: GIS Command Center TypeError - filteredFacilities.filter is not a function');
  console.log('Fix Applied: Added Array.isArray() defensive check on line 30');
  console.log('='.repeat(80) + '\n');

  // Navigate to app
  await page.goto('http://localhost:5174');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Click GIS Command Center
  console.log('🔍 Clicking "GIS Command Center" navigation item...');
  await page.click('aside button:has-text("GIS Command Center")');
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ path: '/tmp/PDCA-LOOP-1-GIS-AFTER-FIX.png', fullPage: false });
  console.log('📸 Screenshot saved: /tmp/PDCA-LOOP-1-GIS-AFTER-FIX.png');

  // Check for TypeError
  const hasTypeError = consoleErrors.some(err =>
    err.includes('filteredFacilities.filter is not a function')
  );

  console.log('\n' + '─'.repeat(80));
  console.log('VERIFICATION RESULTS:');
  console.log('─'.repeat(80));
  console.log(`Console Errors Captured: ${consoleErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log('\nErrors:');
    consoleErrors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.substring(0, 150)}...`);
    });
  } else {
    console.log('✅ NO CONSOLE ERRORS DETECTED');
  }

  console.log(`\nTypeError Present: ${hasTypeError ? '❌ YES' : '✅ NO'}`);
  console.log('─'.repeat(80) + '\n');

  // Assert no TypeError
  expect(hasTypeError, 'GIS Command Center should not throw filteredFacilities TypeError').toBe(false);

  console.log('✓ PDCA LOOP 1 — CHECK PASSED\n');
});
