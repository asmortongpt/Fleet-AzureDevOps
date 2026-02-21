/**
 * Deep smoke test: Navigate hub pages, click tabs, check for JS errors
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

function setupErrorTracking(page: any, pageName: string) {
  const errors: string[] = [];
  const uncaught: string[] = [];

  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('favicon') || text.includes('net::ERR') || text.includes('404 (Not Found)') || text.includes('Failed to load resource')) return;
      errors.push(text);
    }
  });

  page.on('pageerror', (err: any) => {
    uncaught.push(err.message);
  });

  return { errors, uncaught };
}

async function waitForPageReady(page: any) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // Wait for lazy-loaded content to render
  await page.waitForTimeout(3000);
  // Wait for any loading indicators to disappear
  await page.waitForSelector('[class*="loading"], [class*="spinner"], [class*="skeleton"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
}

// Test each hub with tab clicking
test.describe('Fleet Operations Hub - All Tabs', () => {
  test('Overview tab', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page, 'Fleet > Overview');
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
    expect(uncaught).toEqual([]);
  });

  for (const tab of ['Fleet', 'Drivers', 'Operations', 'Maintenance', 'Assets']) {
    test(`${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page, `Fleet > ${tab}`);
      await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Compliance & Safety Hub - All Tabs', () => {
  for (const tab of ['Compliance', 'Safety', 'Policies', 'Reports']) {
    test(`${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page, `Compliance > ${tab}`);
      await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('People & Communication Hub - All Tabs', () => {
  for (const tab of ['People', 'Communication', 'Tasks']) {
    test(`${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page, `People > ${tab}`);
      await page.goto(`${BASE_URL}/communication-hub-consolidated`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Business Management Hub - All Tabs', () => {
  for (const tab of ['Financial', 'Procurement', 'Analytics', 'Reports']) {
    test(`${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page, `Business > ${tab}`);
      await page.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Admin Configuration Hub - All Tabs', () => {
  for (const tab of ['Admin', 'Configuration', 'Data', 'Integrations', 'Documents']) {
    test(`${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page, `Admin > ${tab}`);
      await page.goto(`${BASE_URL}/cta-configuration-hub`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

// Sidebar navigation
test.describe('Sidebar Navigation', () => {
  const navItems = [
    { label: 'Fleet', expectedUrl: '/fleet' },
    { label: 'Ops', expectedUrl: '/fleet' },
    { label: 'Maint', expectedUrl: '/fleet' },
    { label: 'Safety', expectedUrl: '/compliance-safety' },
    { label: 'Stats', expectedUrl: '/analytics' },
    { label: 'Admin', expectedUrl: '/cta-configuration-hub' },
  ];

  for (const nav of navItems) {
    test(`Navigate to ${nav.label}`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page, `Nav > ${nav.label}`);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const navBtn = page.locator(`nav a:has-text("${nav.label}"), nav button:has-text("${nav.label}"), [class*="sidebar"] a:has-text("${nav.label}"), [class*="sidebar"] button:has-text("${nav.label}")`).first();
      if (await navBtn.isVisible()) {
        await navBtn.click();
        await waitForPageReady(page);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

// Drilldown interactions
test.describe('Drilldown Interactions', () => {
  test('Click a vehicle row in Fleet tab', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page, 'Drilldown > Vehicle');
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible()) {
      await row.click();
      await page.waitForTimeout(2000);
    }
    expect(uncaught).toEqual([]);
  });

  test('Click a safety alert row', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page, 'Drilldown > SafetyAlert');
    await page.goto(`${BASE_URL}/safety-alerts`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const viewBtn = page.locator('button[aria-label*="view"], button:has-text("View"), [class*="eye"]').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(uncaught).toEqual([]);
  });

  test('Click a work order in Maintenance tab', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page, 'Drilldown > WorkOrder');
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const maintTab = page.getByRole('tab', { name: 'Maintenance' }).or(page.locator('button:has-text("Maintenance")')).first();
    if (await maintTab.isVisible()) {
      await maintTab.click();
      await waitForPageReady(page);
    }
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible()) {
      await row.click();
      await page.waitForTimeout(2000);
    }
    expect(uncaught).toEqual([]);
  });
});

// Command palette
test('Command palette opens and searches', async ({ page }) => {
  const { uncaught } = setupErrorTracking(page, 'CommandPalette');
  await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitForPageReady(page);
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(500);
  const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], [role="combobox"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('vehicle');
    await page.waitForTimeout(1000);
  }
  await page.keyboard.press('Escape');
  expect(uncaught).toEqual([]);
});
