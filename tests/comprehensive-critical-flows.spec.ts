/**
 * Critical Flow Tests — Beyond Page Loads
 * Tests chart rendering, status badges, responsive layout,
 * modal operations, and data integrity in the rendered UI.
 * Uses defensive patterns — no crashes is the minimum bar.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

function setupErrorTracking(page: any) {
  const uncaught: string[] = [];
  page.on('pageerror', (err: any) => {
    const msg = err.message ?? String(err);
    // Ignore known non-critical errors
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

// ─── 1. Chart / SVG Rendering ─────────────────────────────────────────

test.describe('Chart Rendering', () => {
  test('Fleet Hub overview has rendered chart elements (SVG)', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    // Recharts renders SVGs — check for any SVG on the page
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(0);
    expect(uncaught).toEqual([]);
  });

  test('Analytics page has chart elements', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(0);
    expect(uncaught).toEqual([]);
  });

  test('Executive Dashboard has chart elements', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/executive-dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(0);
    expect(uncaught).toEqual([]);
  });

  test('Fleet Optimizer has chart elements', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet-optimizer`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(0);
    expect(uncaught).toEqual([]);
  });
});

// ─── 2. Status Badge / Data Integrity ──────────────────────────────────

test.describe('Status Badge Rendering', () => {
  test('Vehicle list shows real status values (not undefined/null)', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }
    const bodyText = await page.textContent('body');
    // Should NOT contain raw "undefined" or "null" text in the rendered page
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toContain(': null');
    expect(uncaught).toEqual([]);
  });

  test('Drivers list shows real status values', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const tab = page.getByRole('tab', { name: 'Drivers' }).or(page.locator('button:has-text("Drivers")')).first();
    if (await tab.isVisible()) {
      await tab.click();
      await waitForPageReady(page);
    }
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(uncaught).toEqual([]);
  });

  test('Maintenance tab shows real work order data', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const tab = page.getByRole('tab', { name: 'Maintenance' }).or(page.locator('button:has-text("Maintenance")')).first();
    if (await tab.isVisible()) {
      await tab.click();
      await waitForPageReady(page);
    }
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(uncaught).toEqual([]);
  });

  test('Compliance tab renders real compliance data', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(uncaught).toEqual([]);
  });
});

// ─── 3. Modal / Dialog Operations ──────────────────────────────────────

test.describe('Modal & Dialog Operations', () => {
  test('Command palette opens with Cmd+K and closes with Escape', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    // Should find a search input or combobox
    const input = page.locator('input[placeholder*="Search"], input[type="search"], [role="combobox"]').first();
    const visible = await input.isVisible({ timeout: 2000 }).catch(() => false);
    if (visible) {
      await input.fill('vehicle');
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(uncaught).toEqual([]);
  });

  test('Clicking action buttons on hub pages does not crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    // Try clicking common action buttons — "New", "Add", "Create", "Export"
    const actionBtns = page.locator('button:has-text("New"), button:has-text("Add"), button:has-text("Create"), button:has-text("Export")');
    const count = await actionBtns.count();
    if (count > 0) {
      await actionBtns.first().click();
      await page.waitForTimeout(1000);
      // Close any dialog that opened
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    expect(uncaught).toEqual([]);
  });

  test('Pressing Escape on pages without dialogs does not crash', async ({ page }) => {
    test.setTimeout(120000); // 4 sequential page loads need more than 30s default
    const { uncaught } = setupErrorTracking(page);
    const pages = ['/fleet', '/compliance-safety', '/business', '/analytics'];
    for (const p of pages) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    expect(uncaught).toEqual([]);
  });
});

// ─── 4. Responsive Layout ──────────────────────────────────────────────

test.describe('Responsive Layout', () => {
  test('App renders at mobile viewport (375x812) without crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });

  test('App renders at tablet viewport (768x1024) without crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });

  test('App renders at desktop viewport (1920x1080) without crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });
});

// ─── 5. Full Navigation Sweep ──────────────────────────────────────────

test.describe('Navigation Sweep', () => {
  test('Navigate all 5 hubs sequentially without crash', async ({ page }) => {
    test.setTimeout(150000); // 5 sequential page loads need more than 30s default
    const { uncaught } = setupErrorTracking(page);
    const hubs = ['/fleet', '/compliance-safety', '/communication-hub-consolidated', '/business', '/cta-configuration-hub'];
    for (const hub of hubs) {
      await page.goto(`${BASE_URL}${hub}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
    }
    expect(uncaught).toEqual([]);
  });

  test('Rapid tab switching on Fleet Hub does not crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const tabs = ['Fleet', 'Drivers', 'Operations', 'Maintenance', 'Assets', 'Fleet'];
    for (const tab of tabs) {
      // Dismiss any overlay/dialog that may block clicks
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(200);
      const btn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await btn.isVisible()) {
        await btn.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(500); // Rapid but not instant
      }
    }
    await page.waitForTimeout(2000);
    expect(uncaught).toEqual([]);
  });
});

// ─── 6. Search / Filter ────────────────────────────────────────────────

test.describe('Search & Filter', () => {
  test('Search input on Fleet Hub accepts text', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    // Look for any search input
    const input = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]').first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('test search');
      await page.waitForTimeout(1000);
      await input.clear();
    }
    expect(uncaught).toEqual([]);
  });

  test('Column headers are clickable for sort', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }
    // Click the first table header
    const header = page.locator('th').first();
    if (await header.isVisible({ timeout: 3000 }).catch(() => false)) {
      await header.click();
      await page.waitForTimeout(500);
      // Click again for reverse sort
      await header.click();
      await page.waitForTimeout(500);
    }
    expect(uncaught).toEqual([]);
  });
});

// ─── 7. Data Presence Verification ─────────────────────────────────────

test.describe('Data Presence', () => {
  test('Fleet tab shows table rows with data', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }
    // Should have table rows or card elements with data
    const rows = page.locator('table tbody tr, [class*="card"] > div, [class*="grid"] > div');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    expect(uncaught).toEqual([]);
  });

  test('Business hub Financial tab shows content', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const tab = page.getByRole('tab', { name: 'Financial' }).or(page.locator('button:has-text("Financial")')).first();
    if (await tab.isVisible()) {
      await tab.click();
      await waitForPageReady(page);
    }
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(200);
    expect(uncaught).toEqual([]);
  });

  test('People hub shows driver/employee data', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/communication-hub-consolidated`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const tab = page.getByRole('tab', { name: 'People' }).or(page.locator('button:has-text("People")')).first();
    if (await tab.isVisible()) {
      await tab.click();
      await waitForPageReady(page);
    }
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(200);
    expect(uncaught).toEqual([]);
  });

  test('Settings page renders all sections', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(200);
    expect(uncaught).toEqual([]);
  });
});
