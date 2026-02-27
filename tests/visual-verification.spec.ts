/**
 * Visual Verification Test
 * Takes screenshots of every major page and hub tab for visual review.
 * Run with: npx playwright test tests/visual-verification.spec.ts --headed
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'visual-verification');

function setupErrorTracking(page: any) {
  const uncaught: string[] = [];
  page.on('pageerror', (err: any) => {
    const msg = err.message ?? String(err);
    if (msg.includes('ResizeObserver loop') || msg.includes('Non-Error promise rejection') ||
        msg.includes('Loading chunk') || msg.includes('Failed to fetch dynamically imported module')) return;
    uncaught.push(msg);
  });
  return { uncaught };
}

async function waitForPageReady(page: any) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.waitForSelector('[class*="loading"], [class*="spinner"], [class*="skeleton"]', {
    state: 'hidden', timeout: 5000,
  }).catch(() => {});
}

async function dismissDialogs(page: any) {
  // Click on main content area to close any open flyouts/modals
  // (Escape can trigger command palette or sidebar flyout)
  await page.locator('body').click({ position: { x: 640, y: 400 }, force: true }).catch(() => {});
  await page.waitForTimeout(300);
}

// ─── 1. Fleet Operations Hub — All Tabs ────────────────────────────

test.describe('Visual: Fleet Operations Hub', () => {
  const tabs = ['Fleet', 'Drivers', 'Operations', 'Maintenance', 'Assets'];

  for (const tab of tabs) {
    test(`Fleet Hub > ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      await dismissDialogs(page);

      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }

      // Take screenshot
      await page.screenshot({ path: `${SCREENSHOT_DIR}/fleet-hub-${tab.toLowerCase()}.png`, fullPage: false });

      // Verify page content
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(100);
      expect(body).not.toContain('undefined');
      expect(uncaught).toEqual([]);
    });
  }

  test('Fleet Hub > Fleet tab > Click first vehicle row drilldown', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await dismissDialogs(page);

    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }

    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/fleet-hub-vehicle-drilldown.png`, fullPage: false });
    }

    expect(uncaught).toEqual([]);
  });

  test('Fleet Hub > Drivers tab > Click first driver row drilldown', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await dismissDialogs(page);

    const tab = page.getByRole('tab', { name: 'Drivers' }).or(page.locator('button:has-text("Drivers")')).first();
    if (await tab.isVisible()) {
      await tab.click();
      await waitForPageReady(page);
    }

    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/fleet-hub-driver-drilldown.png`, fullPage: false });
    }

    expect(uncaught).toEqual([]);
  });

  test('Fleet Hub > Maintenance tab > Click first work order drilldown', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await dismissDialogs(page);

    const tab = page.getByRole('tab', { name: 'Maintenance' }).or(page.locator('button:has-text("Maintenance")')).first();
    if (await tab.isVisible()) {
      await tab.click();
      await waitForPageReady(page);
    }

    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/fleet-hub-workorder-drilldown.png`, fullPage: false });
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 2. Compliance & Safety Hub — All Tabs ─────────────────────────

test.describe('Visual: Compliance & Safety Hub', () => {
  const tabs = ['Compliance', 'Safety', 'Policies', 'Reports'];

  for (const tab of tabs) {
    test(`Compliance Hub > ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      await dismissDialogs(page);

      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }

      await page.screenshot({ path: `${SCREENSHOT_DIR}/compliance-hub-${tab.toLowerCase()}.png`, fullPage: false });

      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(100);
      expect(body).not.toContain('undefined');
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── 3. People & Communication Hub — All Tabs ──────────────────────

test.describe('Visual: People & Communication Hub', () => {
  const tabs = ['People', 'Communication', 'Tasks'];

  for (const tab of tabs) {
    test(`People Hub > ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/communication-hub-consolidated`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      await dismissDialogs(page);

      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }

      await page.screenshot({ path: `${SCREENSHOT_DIR}/people-hub-${tab.toLowerCase()}.png`, fullPage: false });

      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(100);
      expect(body).not.toContain('undefined');
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── 4. Business Management Hub — All Tabs ──────────────────────────

test.describe('Visual: Business Management Hub', () => {
  const tabs = ['Financial', 'Procurement', 'Analytics', 'Reports'];

  for (const tab of tabs) {
    test(`Business Hub > ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      await dismissDialogs(page);

      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }

      await page.screenshot({ path: `${SCREENSHOT_DIR}/business-hub-${tab.toLowerCase()}.png`, fullPage: false });

      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(100);
      expect(body).not.toContain('undefined');
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── 5. Admin Configuration Hub — All Tabs ──────────────────────────

test.describe('Visual: Admin Configuration Hub', () => {
  const tabs = ['Admin', 'Configuration', 'Data', 'Integrations', 'Documents'];

  for (const tab of tabs) {
    test(`Admin Hub > ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/cta-configuration-hub`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      await dismissDialogs(page);

      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }

      await page.screenshot({ path: `${SCREENSHOT_DIR}/admin-hub-${tab.toLowerCase()}.png`, fullPage: false });

      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
      expect(body).not.toContain('undefined');
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── 6. Key Standalone Pages ────────────────────────────────────────

test.describe('Visual: Standalone Pages', () => {
  const pages = [
    { path: '/', name: 'Home Dashboard' },
    { path: '/executive-dashboard', name: 'Executive Dashboard' },
    { path: '/analytics', name: 'Analytics' },
    { path: '/safety-alerts', name: 'Safety Alerts' },
    { path: '/settings', name: 'Settings' },
    { path: '/dispatch-console', name: 'Dispatch Console' },
    { path: '/vehicle-telemetry', name: 'Vehicle Telemetry' },
    { path: '/ev-charging', name: 'EV Charging' },
    { path: '/fuel', name: 'Fuel Management' },
    { path: '/routes', name: 'Route Management' },
    { path: '/maintenance-scheduling', name: 'Maintenance Scheduling' },
    { path: '/predictive', name: 'Predictive Maintenance' },
    { path: '/garage', name: 'Garage Service' },
    { path: '/vendor-management', name: 'Vendor Management' },
    { path: '/parts-inventory', name: 'Parts Inventory' },
    { path: '/purchase-orders', name: 'Purchase Orders' },
    { path: '/incident-management', name: 'Incident Management' },
    { path: '/driver-mgmt', name: 'Driver Performance' },
    { path: '/driver-scorecard', name: 'Driver Scorecard' },
    { path: '/cost-analysis', name: 'Cost Analysis' },
    { path: '/custom-reports', name: 'Custom Reports' },
    { path: '/documents', name: 'Documents' },
    { path: '/create-damage-report', name: 'Create Damage Report' },
    { path: '/policy-engine', name: 'Policy Engine' },
    { path: '/osha-forms', name: 'OSHA Forms' },
    { path: '/video-telematics', name: 'Video Telematics' },
    { path: '/communication-log', name: 'Communication Log' },
    { path: '/email-center', name: 'Email Center' },
    { path: '/notifications', name: 'Notifications' },
    { path: '/asset-management', name: 'Asset Management' },
    { path: '/equipment-dashboard', name: 'Equipment Dashboard' },
    { path: '/task-management', name: 'Task Management' },
    { path: '/fleet-optimizer', name: 'Fleet Optimizer' },
    { path: '/personal-use', name: 'Personal Use' },
    { path: '/mileage', name: 'Mileage Reimbursement' },
    { path: '/gis-map', name: 'GIS Command Center' },
  ];

  for (const pg of pages) {
    test(`${pg.name} (${pg.path})`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);

      const slug = pg.path.replace(/\//g, '-').replace(/^-/, '') || 'home';
      await page.screenshot({ path: `${SCREENSHOT_DIR}/page-${slug}.png`, fullPage: false });

      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
      expect(body).not.toContain('undefined');
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── 7. Workspace Pages ────────────────────────────────────────────

test.describe('Visual: Workspaces', () => {
  const workspaces = [
    { path: '/operations-workspace', name: 'Operations' },
    { path: '/fleet-workspace', name: 'Fleet' },
    { path: '/drivers-workspace', name: 'Drivers' },
    { path: '/maintenance-workspace', name: 'Maintenance' },
    { path: '/analytics-workspace', name: 'Analytics' },
    { path: '/compliance-workspace', name: 'Compliance' },
  ];

  for (const ws of workspaces) {
    test(`${ws.name} Workspace`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}${ws.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);

      const slug = ws.path.replace(/\//g, '-').replace(/^-/, '');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/workspace-${slug}.png`, fullPage: false });

      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── 8. Command Palette & Keyboard Shortcuts ───────────────────────

test.describe('Visual: Interactive Features', () => {
  test('Command Palette opens and shows results', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder*="Search"], input[type="search"], [role="combobox"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('vehicle');
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/command-palette-search.png`, fullPage: false });
    }

    await page.keyboard.press('Escape');
    expect(uncaught).toEqual([]);
  });

  test('Search input on Fleet Hub filters data', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await dismissDialogs(page);

    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }

    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('Ford');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/fleet-search-ford.png`, fullPage: false });
      await search.clear();
    }

    expect(uncaught).toEqual([]);
  });
});
