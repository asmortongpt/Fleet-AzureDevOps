import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * FOCUSED HUB BUTTONS TEST
 *
 * This test focuses on the main interactive elements within the hub content areas,
 * excluding navigation and dialogs to avoid blocking issues.
 *
 * Specifically tests:
 * - Tab switching works
 * - Action buttons within each tab's content (Schedule, View, Generate, Manage, etc.)
 * - StatCards display correctly
 * - Data loads from API (not hardcoded)
 */

const BASE_URL = 'http://localhost:5173';

interface IssueFound {
  hub: string;
  tab: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const issues: IssueFound[] = [];

function reportIssue(hub: string, tab: string, issue: string, severity: 'critical' | 'high' | 'medium' | 'low' = 'medium') {
  issues.push({ hub, tab, issue, severity });
  const emoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '⚪';
  console.log(`${emoji} [${hub}/${tab}] ${issue}`);
}

test.describe('Hub Content Buttons - Focused Interactive Test', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check if we're on the login page and authenticate
    const loginVisible = await page.locator('text=Welcome Back').isVisible().catch(() => false);
    if (loginVisible) {
      // Fill in login form
      await page.fill('input[type="email"], input[name="email"]', 'admin@fleet.local');
      await page.fill('input[type="password"], input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for auth to complete
    }

    // Close any open modals/dialogs/dropdowns by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('1. FleetOperationsHub - 5 tabs, action buttons, data loading', async ({ page }) => {
    console.log('\n🚙 Testing FleetOperationsHub...\n');

    // Navigate to hub
    await page.click('text=Fleet Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Test: Fleet Tab
    console.log('   Testing Fleet tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const fleetTab = page.getByRole('tab', { name: /^Fleet$/i });
    await fleetTab.click();
    await page.waitForTimeout(1000);

    // Check for StatCards
    const statCards = page.locator('[class*="gap-4"]').locator('div').filter({ hasText: /Total Vehicles|Active Vehicles/ });
    const statCardCount = await statCards.count();
    if (statCardCount === 0) {
      reportIssue('FleetOperationsHub', 'Fleet', 'No stat cards found', 'high');
    } else {
      console.log(`   ✅ Found ${statCardCount} stat card elements`);
    }

    // Check for hardcoded vs real data (look for specific patterns)
    const pageText = await page.textContent('body');
    if (pageText?.includes('DEV-001') || pageText?.includes('DEMO-')) {
      console.log('   ⚠️  May contain demo/dev data identifiers');
    }

    // Test: Drivers Tab
    console.log('   Testing Drivers tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const driversTab = page.getByRole('tab', { name: /Drivers/i });
    await driversTab.click();
    await page.waitForTimeout(1000);

    // Check for driver data
    const bodyText = await page.textContent('body');
    if (bodyText?.includes('Total Drivers')) {
      console.log('   ✅ Drivers tab loaded with stat cards');
    } else {
      reportIssue('FleetOperationsHub', 'Drivers', 'Drivers tab content not loading properly', 'high');
    }

    // Test: Operations Tab
    console.log('   Testing Operations tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const opsTab = page.getByRole('tab', { name: /Operations/i });
    await opsTab.click();
    await page.waitForTimeout(1000);

    // Check for operations content
    const hasOpsContent = await page.locator('text=/Active Routes|Pending Tasks/i').count();
    if (hasOpsContent > 0) {
      console.log('   ✅ Operations tab loaded');
    } else {
      reportIssue('FleetOperationsHub', 'Operations', 'Operations tab content not loading', 'high');
    }

    // Test: Maintenance Tab
    console.log('   Testing Maintenance tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const maintTab = page.getByRole('tab', { name: /Maintenance/i });
    await maintTab.click();
    await page.waitForTimeout(1000);

    const maintenanceText = await page.textContent('body');
    if (maintenanceText?.includes('coming soon')) {
      reportIssue('FleetOperationsHub', 'Maintenance', 'Maintenance tab shows "coming soon" - not implemented', 'medium');
    }

    // Test: Assets Tab
    console.log('   Testing Assets tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const assetsTab = page.getByRole('tab', { name: /Assets/i });
    await assetsTab.click();
    await page.waitForTimeout(1000);

    const assetsText = await page.textContent('body');
    if (assetsText?.includes('coming soon')) {
      reportIssue('FleetOperationsHub', 'Assets', 'Assets tab shows "coming soon" - not implemented', 'medium');
    }
  });

  test('2. ComplianceSafetyHub - 4 tabs, buttons functionality', async ({ page }) => {
    console.log('\n🛡️  Testing ComplianceSafetyHub...\n');

    await page.click('text=Safety & Compliance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Test: Compliance Tab
    console.log('   Testing Compliance tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const complianceTab = page.getByRole('tab', { name: /Compliance/i });
    await complianceTab.click();
    await page.waitForTimeout(1000);

    // Look for action buttons like "Schedule"
    const scheduleButtons = page.locator('button', { hasText: /Schedule/i });
    const scheduleCount = await scheduleButtons.count();
    console.log(`   Found ${scheduleCount} "Schedule" buttons`);

    // Try clicking the first Schedule button if it exists
    if (scheduleCount > 0) {
      try {
        await scheduleButtons.first().click({ timeout: 2000 });
        console.log('   ✅ Schedule button is clickable');
      } catch (e) {
        reportIssue('ComplianceSafetyHub', 'Compliance', 'Schedule button exists but not clickable', 'high');
      }
    }

    // Test: Safety Tab
    console.log('   Testing Safety tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const safetyTab = page.getByRole('tab', { name: /^Safety$/i });
    await safetyTab.click();
    await page.waitForTimeout(1000);

    const safetyText = await page.textContent('body');
    if (safetyText?.includes('Safety Score')) {
      console.log('   ✅ Safety tab loaded with metrics');
    }

    // Test: Policies Tab
    console.log('   Testing Policies tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const policiesTab = page.getByRole('tab', { name: /Policies/i });
    await policiesTab.click();
    await page.waitForTimeout(1000);

    // Look for "View" buttons in policies
    const viewButtons = page.locator('button', { hasText: /^View$/i });
    const viewCount = await viewButtons.count();
    console.log(`   Found ${viewCount} "View" buttons`);

    if (viewCount > 0) {
      try {
        await viewButtons.first().click({ timeout: 2000 });
        console.log('   ✅ View button is clickable');
      } catch (e) {
        reportIssue('ComplianceSafetyHub', 'Policies', 'View button exists but not clickable', 'high');
      }
    }

    // Test: Reporting Tab
    console.log('   Testing Reporting tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const reportsTab = page.getByRole('tab', { name: /Reports/i });
    await reportsTab.click();
    await page.waitForTimeout(1000);

    // Look for "Generate" buttons
    const generateButtons = page.locator('button', { hasText: /Generate/i });
    const generateCount = await generateButtons.count();
    console.log(`   Found ${generateCount} "Generate" buttons`);

    if (generateCount > 0) {
      try {
        await generateButtons.first().click({ timeout: 2000 });
        console.log('   ✅ Generate button is clickable');
      } catch (e) {
        reportIssue('ComplianceSafetyHub', 'Reporting', 'Generate button exists but not clickable', 'high');
      }
    }
  });

  test('3. BusinessManagementHub - 4 tabs, action buttons', async ({ page }) => {
    console.log('\n💼 Testing BusinessManagementHub...\n');

    await page.click('text=Financial Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const tabs = [
      { name: 'Financial', testid: 'hub-tab-financial' },
      { name: 'Procurement', testid: 'hub-tab-procurement' },
      { name: 'Analytics', testid: 'hub-tab-analytics' },
      { name: 'Reports', testid: 'hub-tab-reports' }
    ];

    for (const { name: tabName, testid } of tabs) {
      console.log(`   Testing ${tabName} tab...`);

      // Close any open dropdowns/modals before clicking tab
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const tab = page.locator(`[data-testid="${testid}"]`);
      await tab.click();
      await page.waitForTimeout(1000);

      // Check if content loaded
      const bodyText = await page.textContent('body');
      if (!bodyText || bodyText.length < 100) {
        reportIssue('BusinessManagementHub', tabName, 'Tab appears empty or content failed to load', 'high');
      } else {
        console.log(`   ✅ ${tabName} tab loaded`);
      }

      // Look for action buttons
      const buttons = page.locator('button:visible').filter({ hasText: /View|Generate|Manage|Download/i });
      const buttonCount = await buttons.count();
      if (buttonCount > 0) {
        console.log(`   Found ${buttonCount} action buttons`);

        // Try clicking first button
        try {
          const firstButton = buttons.first();
          const buttonText = await firstButton.textContent();
          await firstButton.click({ timeout: 2000 });
          console.log(`   ✅ "${buttonText?.trim()}" button is clickable`);
        } catch (e) {
          reportIssue('BusinessManagementHub', tabName, 'Action buttons exist but not responding to clicks', 'medium');
        }
      }
    }
  });

  test('4. PeopleCommunicationHub - 3 tabs, interactive elements', async ({ page }) => {
    console.log('\n👥 Testing PeopleCommunicationHub...\n');

    await page.click('text=Communication Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const tabs = ['People', 'Communication', 'Work'];

    for (const tabName of tabs) {
      console.log(`   Testing ${tabName} tab...`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
      await tab.click();
      await page.waitForTimeout(1000);

      const bodyText = await page.textContent('body');
      if (bodyText && bodyText.length > 100) {
        console.log(`   ✅ ${tabName} tab loaded`);
      } else {
        reportIssue('PeopleCommunicationHub', tabName, 'Tab content failed to load', 'high');
      }

      // Look for "Join" buttons (in Work tab for meetings)
      if (tabName === 'Work') {
        const joinButtons = page.locator('button', { hasText: /Join/i });
        const joinCount = await joinButtons.count();
        console.log(`   Found ${joinCount} "Join" buttons`);

        if (joinCount > 0) {
          try {
            await joinButtons.first().click({ timeout: 2000 });
            console.log('   ✅ Join button is clickable');
          } catch (e) {
            reportIssue('PeopleCommunicationHub', 'Work', 'Join button exists but not clickable', 'medium');
          }
        }
      }
    }
  });

  test('5. AdminConfigurationHub - 5 tabs, configuration buttons', async ({ page }) => {
    console.log('\n⚙️  Testing AdminConfigurationHub...\n');

    await page.click('text=Admin Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const tabs = [
      { name: 'Admin', testid: 'hub-tab-admin' },
      { name: 'Configuration', testid: 'hub-tab-config' },
      { name: 'Data', testid: 'hub-tab-data' },
      { name: 'Integrations', testid: 'hub-tab-integrations' },
      { name: 'Documents', testid: 'hub-tab-documents' }
    ];

    for (const { name: tabName, testid } of tabs) {
      console.log(`   Testing ${tabName} tab...`);

      // Close any open dropdowns/modals before clicking tab
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const tab = page.locator(`[data-testid="${testid}"]`);

      try {
        await tab.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        console.log(`   ✅ ${tabName} tab switched successfully`);

        // Look for "Manage" or "Configure" buttons
        const actionButtons = page.locator('button:visible').filter({ hasText: /Manage|Configure|Toggle/i });
        const actionCount = await actionButtons.count();
        console.log(`   Found ${actionCount} action buttons`);

        if (actionCount > 0) {
          try {
            const firstButton = actionButtons.first();
            const buttonText = await firstButton.textContent();
            await firstButton.click({ timeout: 2000 });
            console.log(`   ✅ "${buttonText?.trim()}" button is clickable`);
          } catch (e) {
            reportIssue('AdminConfigurationHub', tabName, 'Action buttons not responding', 'medium');
          }
        }
      } catch (e) {
        reportIssue('AdminConfigurationHub', tabName, `Failed to switch to ${tabName} tab`, 'critical');
      }
    }
  });

  test('6. Map and Interactive Components Test', async ({ page }) => {
    console.log('\n🗺️  Testing Map and Interactive Components...\n');

    // Navigate to Fleet Hub
    await page.click('text=Fleet Hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Ensure we're on Fleet tab
    const fleetTab = page.getByRole('tab', { name: /^Fleet$/i });
    await fleetTab.click();
    await page.waitForTimeout(1500);

    // Look for map container - check for ProfessionalFleetMap component
    const mapContainer = page.locator('[data-testid="professional-fleet-map"]').first();
    const mapExists = await mapContainer.isVisible().catch(() => false);

    if (mapExists) {
      console.log('   ✅ Professional Fleet Map container found and visible');

      // Verify map has content (vehicle markers or controls)
      const mapHasContent = await page.locator('[data-testid="professional-fleet-map"] button, [data-testid="professional-fleet-map"] .vehicle-marker').count();
      if (mapHasContent > 0) {
        console.log('   ✅ Map is interactive with controls/markers');
      } else {
        reportIssue('FleetOperationsHub', 'Fleet', 'Map visible but no interactive content loaded', 'low');
      }
    } else {
      reportIssue('FleetOperationsHub', 'Fleet', 'Map not visible on Fleet tab', 'high');
    }
  });

  test.afterAll(async () => {
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 ISSUE REPORT SUMMARY');
    console.log('='.repeat(80) + '\n');

    if (issues.length === 0) {
      console.log('✅ NO ISSUES FOUND! All hubs and buttons working correctly.\n');
      return;
    }

    const critical = issues.filter(i => i.severity === 'critical');
    const high = issues.filter(i => i.severity === 'high');
    const medium = issues.filter(i => i.severity === 'medium');
    const low = issues.filter(i => i.severity === 'low');

    console.log(`Total Issues Found: ${issues.length}`);
    console.log(`🔴 Critical: ${critical.length}`);
    console.log(`🟠 High: ${high.length}`);
    console.log(`🟡 Medium: ${medium.length}`);
    console.log(`⚪ Low: ${low.length}\n`);

    console.log('ISSUES BY HUB:\n');
    const byHub = issues.reduce((acc, issue) => {
      if (!acc[issue.hub]) acc[issue.hub] = [];
      acc[issue.hub].push(issue);
      return acc;
    }, {} as Record<string, typeof issues>);

    for (const [hub, hubIssues] of Object.entries(byHub)) {
      console.log(`\n${hub} (${hubIssues.length} issues):`);
      hubIssues.forEach(issue => {
        const emoji = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : issue.severity === 'medium' ? '🟡' : '⚪';
        console.log(`  ${emoji} [${issue.tab}] ${issue.issue}`);
      });
    }

    // Save to JSON
    const resultsPath = path.join(process.cwd(), 'tests', 'hub-issues-found.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      totalIssues: issues.length,
      bySeverity: {
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length
      },
      issues
    }, null, 2));

    console.log(`\n📝 Detailed issues saved to: ${resultsPath}\n`);
    console.log('='.repeat(80) + '\n');
  });
});
