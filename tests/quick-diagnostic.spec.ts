import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174';

test('Quick Diagnostic - Check what happens when clicking tabs', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n=== Testing AdminConfigurationHub Tabs ===\n');

  // Navigate to Admin Hub
  await page.click('text=Admin Hub');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot of initial state
  await page.screenshot({ path: 'test-results/admin-hub-initial.png', fullPage: true });

  // Get all tab triggers
  const tabs = page.locator('[role="tab"]');
  const tabCount = await tabs.count();
  console.log(`Found ${tabCount} tabs`);

  for (let i = 0; i < tabCount; i++) {
    const tab = tabs.nth(i);
    const tabText = await tab.textContent();
    const tabValue = await tab.getAttribute('data-value') || await tab.getAttribute('value');
    const ariaSel = await tab.getAttribute('aria-selected');

    console.log(`Tab ${i}: "${tabText?.trim()}" | value="${tabValue}" | selected=${ariaSel}`);
  }

  // Try clicking each tab by test ID
  console.log('\n--- Attempting to click tabs ---\n');

  const tabTestIds = ['hub-tab-admin', 'hub-tab-config', 'hub-tab-data', 'hub-tab-integrations', 'hub-tab-documents'];

  for (const testId of tabTestIds) {
    console.log(`\nClicking [data-testid="${testId}"]...`);
    try {
      const tab = page.locator(`[data-testid="${testId}"]`);
      const exists = await tab.isVisible({ timeout: 2000 });

      if (exists) {
        await tab.click({ timeout: 3000 });
        await page.waitForTimeout(500);

        // Check what's now selected
        const selected = await page.locator('[role="tab"][aria-selected="true"]').textContent();
        console.log(`✅ Clicked! Now selected: "${selected?.trim()}"`);

        // Take screenshot
        const screenshotName = `test-results/admin-hub-${testId}.png`;
        await page.screenshot({ path: screenshotName, fullPage: true });
      } else {
        console.log(`❌ Tab not visible`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\n=== Testing BusinessManagementHub Tabs ===\n');

  // Navigate to Business Hub
  await page.click('text=Financial Hub');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Get tabs
  const bizTabs = page.locator('[role="tab"]');
  const bizTabCount = await bizTabs.count();
  console.log(`Found ${bizTabCount} tabs`);

  for (let i = 0; i < bizTabCount; i++) {
    const tab = bizTabs.nth(i);
    const tabText = await tab.textContent();
    console.log(`Tab ${i}: "${tabText?.trim()}"`);
  }

  // Try clicking Procurement tab
  console.log('\nClicking Procurement tab...');
  try {
    const procTab = page.locator('[data-testid="hub-tab-procurement"]');
    const exists = await procTab.isVisible({ timeout: 2000 });

    if (exists) {
      console.log('Tab is visible, attempting click...');
      await procTab.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      console.log('✅ Click succeeded');
    } else {
      console.log('❌ Tab not found');
    }
  } catch (error) {
    console.log(`❌ Error clicking Procurement: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n=== Diagnostic Complete ===\n');
});
