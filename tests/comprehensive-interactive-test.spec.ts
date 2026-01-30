import { test, expect, Page } from '@playwright/test';

/**
 * COMPREHENSIVE INTERACTIVE ELEMENT TEST
 *
 * This test systematically clicks EVERY button and interactive element across all 5 consolidated hubs
 * to identify which features are broken and which work properly.
 *
 * Test Strategy:
 * 1. Navigate to each hub
 * 2. Click each tab
 * 3. Find and click all buttons
 * 4. Track which buttons/features fail
 * 5. Generate comprehensive failure report
 */

const BASE_URL = 'http://localhost:5174';

interface TestResult {
  hubName: string;
  tabName: string;
  elementType: string;
  elementText: string;
  action: string;
  success: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const status = result.success ? '✅' : '❌';
  console.log(`${status} [${result.hubName}/${result.tabName}] ${result.elementType}: "${result.elementText}" - ${result.action}`);
  if (!result.success && result.error) {
    console.log(`   Error: ${result.error}`);
  }
}

async function clickAndVerify(
  page: Page,
  selector: string,
  hubName: string,
  tabName: string,
  elementType: string,
  elementText: string
): Promise<boolean> {
  try {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible({ timeout: 2000 });

    if (!isVisible) {
      logResult({
        hubName,
        tabName,
        elementType,
        elementText,
        action: 'visibility check',
        success: false,
        error: 'Element not visible'
      });
      return false;
    }

    // Click the element
    await element.click({ timeout: 3000 });
    await page.waitForTimeout(500); // Wait for any animations or state changes

    logResult({
      hubName,
      tabName,
      elementType,
      elementText,
      action: 'clicked',
      success: true
    });
    return true;
  } catch (error) {
    logResult({
      hubName,
      tabName,
      elementType,
      elementText,
      action: 'click attempt',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function testAllButtonsInView(page: Page, hubName: string, tabName: string) {
  console.log(`\n🔍 Testing all buttons in ${hubName} > ${tabName}...`);

  // Find all buttons in the current view
  const buttons = page.locator('button:visible');
  const count = await buttons.count();

  console.log(`   Found ${count} visible buttons`);

  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent().catch(() => 'Unknown');
    const ariaLabel = await button.getAttribute('aria-label').catch(() => null);
    const buttonText = text?.trim() || ariaLabel || `Button ${i + 1}`;

    // Skip navigation buttons that would change the current view
    if (buttonText.includes('Fleet') || buttonText.includes('Drivers') ||
        buttonText.includes('Operations') || buttonText.includes('Safety') ||
        buttonText.includes('Admin') || buttonText.includes('Communication')) {
      continue;
    }

    await clickAndVerify(
      page,
      `button:visible >> nth=${i}`,
      hubName,
      tabName,
      'Button',
      buttonText
    );

    // Return to the same view after clicking
    await page.waitForTimeout(300);
  }
}

async function testTabsAndContent(page: Page, hubName: string, tabs: string[]) {
  console.log(`\n📑 Testing tabs in ${hubName}...`);

  for (const tabName of tabs) {
    console.log(`\n   Switching to tab: ${tabName}`);

    try {
      // Click the tab
      const tabButton = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
      await tabButton.click({ timeout: 5000 });
      await page.waitForTimeout(1000); // Wait for content to load

      logResult({
        hubName,
        tabName,
        elementType: 'Tab',
        elementText: tabName,
        action: 'switched',
        success: true
      });

      // Test all buttons in this tab
      await testAllButtonsInView(page, hubName, tabName);

      // Test stat cards (check if they're clickable)
      const statCards = page.locator('[class*="StatCard"], [class*="stat-card"]');
      const statCount = await statCards.count();
      console.log(`   Found ${statCount} stat cards`);

      // Test if any links are present
      const links = page.locator('a:visible');
      const linkCount = await links.count();
      console.log(`   Found ${linkCount} visible links`);

    } catch (error) {
      logResult({
        hubName,
        tabName,
        elementType: 'Tab',
        elementText: tabName,
        action: 'switch attempt',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

test.describe('Comprehensive Interactive Element Test - All Hubs', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    console.log('\n🚀 Starting comprehensive interactive element test...\n');
  });

  test('1. FleetOperationsHub - Test all interactive elements', async ({ page }) => {
    const hubName = 'FleetOperationsHub';

    // Navigate to Fleet Hub
    await page.click('text=Fleet Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const tabs = ['Fleet', 'Drivers', 'Operations', 'Maintenance', 'Assets'];
    await testTabsAndContent(page, hubName, tabs);
  });

  test('2. ComplianceSafetyHub - Test all interactive elements', async ({ page }) => {
    const hubName = 'ComplianceSafetyHub';

    // Navigate to Safety & Compliance
    await page.click('text=Safety & Compliance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const tabs = ['Compliance', 'Safety', 'Policies', 'Reports'];
    await testTabsAndContent(page, hubName, tabs);
  });

  test('3. BusinessManagementHub - Test all interactive elements', async ({ page }) => {
    const hubName = 'BusinessManagementHub';

    // Navigate to Financial Hub
    await page.click('text=Financial Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const tabs = ['Financial', 'Procurement', 'Analytics', 'Reports'];
    await testTabsAndContent(page, hubName, tabs);
  });

  test('4. PeopleCommunicationHub - Test all interactive elements', async ({ page }) => {
    const hubName = 'PeopleCommunicationHub';

    // Navigate to Communication Hub
    await page.click('text=Communication Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const tabs = ['People', 'Communication', 'Work'];
    await testTabsAndContent(page, hubName, tabs);
  });

  test('5. AdminConfigurationHub - Test all interactive elements', async ({ page }) => {
    const hubName = 'AdminConfigurationHub';

    // Navigate to Admin Hub
    await page.click('text=Admin Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const tabs = ['Admin', 'Configuration', 'Data', 'Integrations', 'Documents'];
    await testTabsAndContent(page, hubName, tabs);
  });

  test.afterAll(async () => {
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('='.repeat(80) + '\n');

    const totalTests = results.length;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const successRate = ((successCount / totalTests) * 100).toFixed(2);

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Successes: ${successCount}`);
    console.log(`❌ Failures: ${failureCount}`);
    console.log(`Success Rate: ${successRate}%\n`);

    // Group failures by hub
    const failuresByHub = results
      .filter(r => !r.success)
      .reduce((acc, result) => {
        if (!acc[result.hubName]) {
          acc[result.hubName] = [];
        }
        acc[result.hubName].push(result);
        return acc;
      }, {} as Record<string, TestResult[]>);

    console.log('🔴 FAILURES BY HUB:\n');
    for (const [hubName, failures] of Object.entries(failuresByHub)) {
      console.log(`\n${hubName} (${failures.length} failures):`);
      failures.forEach(f => {
        console.log(`  ❌ [${f.tabName}] ${f.elementType}: "${f.elementText}"`);
        if (f.error) {
          console.log(`     Error: ${f.error}`);
        }
      });
    }

    // Save results to JSON file for further analysis
    const fs = require('fs');
    const path = require('path');
    const resultsPath = path.join(__dirname, 'test-results-interactive.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      summary: {
        totalTests,
        successCount,
        failureCount,
        successRate: parseFloat(successRate)
      },
      results
    }, null, 2));

    console.log(`\n📝 Detailed results saved to: ${resultsPath}\n`);
    console.log('='.repeat(80) + '\n');
  });
});
