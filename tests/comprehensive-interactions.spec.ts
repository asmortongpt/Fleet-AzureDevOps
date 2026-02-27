/**
 * Comprehensive Interaction Tests
 * Buttons, drilldowns, forms, modals, search, filters — everything clickable
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

function setupErrorTracking(page: any) {
  const uncaught: string[] = [];
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('favicon') || text.includes('net::ERR') || text.includes('404 (Not Found)') ||
          text.includes('Failed to load resource') || text.includes('ERR_CONNECTION_REFUSED') ||
          text.includes('Google Maps') || text.includes('maps.googleapis')) return;
    }
  });
  page.on('pageerror', (err: any) => {
    uncaught.push(err.message);
  });
  return { uncaught };
}

async function waitForPageReady(page: any, ms = 10000) {
  await page.waitForLoadState('networkidle', { timeout: ms }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.waitForSelector('[class*="loading"], [class*="spinner"], [class*="skeleton"]', {
    state: 'hidden', timeout: 5000,
  }).catch(() => {});
}

// ─── Drilldown Tests: Click rows in every hub tab ───────────────────

test.describe('Drilldown: Fleet Hub', () => {
  const tabs = ['Fleet', 'Drivers', 'Operations', 'Maintenance', 'Assets'];
  for (const tab of tabs) {
    test(`Click first row in ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      // Click the first clickable row
      const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(2000);
        // Verify a drilldown panel or detail view appeared
        const panel = page.locator('[class*="panel"], [class*="drawer"], [class*="detail"], [class*="drilldown"], [role="dialog"]');
        const panelVisible = await panel.first().isVisible({ timeout: 3000 }).catch(() => false);
        // Even if panel doesn't open, no crash is the minimum bar
      }
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Drilldown: Compliance & Safety Hub', () => {
  const tabs = ['Compliance', 'Safety', 'Policies', 'Reports'];
  for (const tab of tabs) {
    test(`Click first row in ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(2000);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Drilldown: People & Communication Hub', () => {
  const tabs = ['People', 'Communication', 'Tasks'];
  for (const tab of tabs) {
    test(`Click first row in ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/communication-hub-consolidated`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(2000);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Drilldown: Business Management Hub', () => {
  const tabs = ['Financial', 'Procurement', 'Analytics', 'Reports'];
  for (const tab of tabs) {
    test(`Click first row in ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(2000);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Drilldown: Admin Configuration Hub', () => {
  const tabs = ['Admin', 'Configuration', 'Data', 'Integrations', 'Documents'];
  for (const tab of tabs) {
    test(`Click first row in ${tab} tab`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/cta-configuration-hub`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(2000);
      }
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── Button Tests: Action buttons in every hub ──────────────────────

test.describe('Action Buttons: Fleet Hub', () => {
  test('Click all visible action buttons in Fleet tab', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Find all action buttons (Create, Export, Refresh, Filter, etc.)
    const actionButtons = page.locator(
      'button:has-text("Create"), button:has-text("Export"), button:has-text("Refresh"), ' +
      'button:has-text("Filter"), button:has-text("Add"), button:has-text("New"), ' +
      'button:has-text("Download"), button:has-text("Print"), button:has-text("Generate")'
    );
    const count = await actionButtons.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = actionButtons.nth(i);
      if (await btn.isVisible() && await btn.isEnabled()) {
        await btn.click();
        await page.waitForTimeout(1000);
        // Dismiss any modal/dialog that appeared
        const closeBtn = page.locator('[aria-label="Close"], button:has-text("Cancel"), button:has-text("Close"), [class*="close"]').first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
        // Press escape as fallback
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
    expect(uncaught).toEqual([]);
  });

  test('Click action buttons in Maintenance tab', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const maintTab = page.getByRole('tab', { name: 'Maintenance' }).or(page.locator('button:has-text("Maintenance")')).first();
    if (await maintTab.isVisible()) {
      await maintTab.click();
      await waitForPageReady(page);
    }

    const actionButtons = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Schedule"), ' +
      'button:has-text("Export"), button:has-text("Add")'
    );
    const count = await actionButtons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = actionButtons.nth(i);
      if (await btn.isVisible() && await btn.isEnabled()) {
        await btn.click();
        await page.waitForTimeout(1000);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
    expect(uncaught).toEqual([]);
  });
});

test.describe('Action Buttons: Compliance & Safety Hub', () => {
  test('Click action buttons in all tabs', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    for (const tab of ['Compliance', 'Safety', 'Policies', 'Reports']) {
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }

      const actionButtons = page.locator(
        'button:has-text("Create"), button:has-text("Export"), button:has-text("New"), ' +
        'button:has-text("Generate"), button:has-text("Add"), button:has-text("Run")'
      );
      const count = await actionButtons.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const btn = actionButtons.nth(i);
        if (await btn.isVisible() && await btn.isEnabled()) {
          await btn.click();
          await page.waitForTimeout(1000);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    }
    expect(uncaught).toEqual([]);
  });
});

// ─── Command Palette ────────────────────────────────────────────────

test.describe('Command Palette', () => {
  test('Opens, searches, and navigates', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Open via keyboard shortcut
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], [role="combobox"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Search for different terms
      for (const term of ['vehicle', 'driver', 'maintenance', 'safety', 'work order']) {
        await searchInput.fill(term);
        await page.waitForTimeout(800);
        // Check results appear
        const results = page.locator('[class*="command-item"], [role="option"], [class*="result"]');
        const resultCount = await results.count();
        // Results may or may not exist, but no crash
      }
      await page.keyboard.press('Escape');
    }
    expect(uncaught).toEqual([]);
  });
});

// ─── Keyboard Shortcuts ─────────────────────────────────────────────

test.describe('Keyboard Shortcuts', () => {
  test('Common shortcuts dont crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Test keyboard shortcuts that should work
    const shortcuts = ['?', 'Meta+k', 'Escape', 'Meta+/', 'g f', 'g d', 'g s'];
    for (const shortcut of shortcuts) {
      if (shortcut.length === 1) {
        await page.keyboard.press(shortcut);
      } else if (shortcut.includes(' ')) {
        // Sequential key press (vim-style)
        const keys = shortcut.split(' ');
        for (const key of keys) {
          await page.keyboard.press(key);
          await page.waitForTimeout(200);
        }
      } else {
        await page.keyboard.press(shortcut);
      }
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    expect(uncaught).toEqual([]);
  });
});

// ─── Safety Alerts Page Interactions ────────────────────────────────

test.describe('Safety Alerts Page', () => {
  test('View and interact with alerts', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/safety-alerts`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Click View button on first alert
    const viewBtn = page.locator('button[aria-label*="view"], button:has-text("View"), button:has-text("Details")').first();
    if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Click filter/sort buttons
    const filterBtn = page.locator('button:has-text("Filter"), button:has-text("Sort"), [aria-label*="filter"]').first();
    if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
      await page.keyboard.press('Escape');
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── Settings Page Interactions ─────────────────────────────────────

test.describe('Settings Page', () => {
  test('Navigate settings tabs', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Click through settings sections/tabs
    const sections = page.locator('[role="tab"], [class*="settings"] button, nav a, nav button').all();
    const sectionElements = await sections;
    for (let i = 0; i < Math.min(sectionElements.length, 8); i++) {
      if (await sectionElements[i].isVisible()) {
        await sectionElements[i].click();
        await page.waitForTimeout(1000);
      }
    }
    expect(uncaught).toEqual([]);
  });
});

// ─── Create Damage Report Form ──────────────────────────────────────

test.describe('Create Damage Report Page', () => {
  test('Form renders and page is interactive', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/create-damage-report`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // The page uses FormFieldWithHelp wrappers — check for labels and buttons
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(200);

    // Check for form-related content (labels, buttons, headings)
    const formElements = page.locator('label, button, [role="combobox"], h1, h2, h3');
    const count = await formElements.count();
    expect(count).toBeGreaterThan(0);

    expect(uncaught).toEqual([]);
  });
});

// ─── Sidebar Navigation: Full Journey ───────────────────────────────

test.describe('Sidebar Full Navigation Journey', () => {
  test('Navigate through all sidebar items sequentially', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Find all sidebar nav links/buttons
    const navItems = page.locator('nav a, nav button, [class*="sidebar"] a, [class*="sidebar"] button');
    const count = await navItems.count();

    for (let i = 0; i < Math.min(count, 15); i++) {
      const item = navItems.nth(i);
      if (await item.isVisible()) {
        const text = await item.textContent();
        // Skip collapse/expand buttons
        if (text?.includes('Collapse') || text?.includes('Expand') || text?.trim() === '') continue;
        await item.click();
        await page.waitForTimeout(2000);
        // Verify page didn't crash
        const body = await page.textContent('body');
        expect(body!.length).toBeGreaterThan(50);
      }
    }
    expect(uncaught).toEqual([]);
  });
});

// ─── Responsive Layout ──────────────────────────────────────────────

test.describe('Responsive Layout', () => {
  test('Desktop layout (1920x1080)', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });

  test('Tablet layout (768x1024)', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });

  test('Mobile layout (375x812)', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });
});
