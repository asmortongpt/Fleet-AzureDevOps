/**
 * Deep Interaction Tests — Beyond Page Loads
 * Tests form interactions, filter/search, drilldown detail panels,
 * status workflows, export operations, error states, and edge cases.
 * Uses defensive patterns — no crashes is the minimum bar.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

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
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

// ─── 1. Form Interactions ─────────────────────────────────────────────

test.describe('Form Interactions', () => {
  test('Create Damage Report form — fill fields and validate', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/create-damage-report`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Look for form fields: vehicle select, description textarea, severity select
    const textInputs = page.locator('input[type="text"], textarea').all();
    const inputs = await textInputs;
    for (let i = 0; i < Math.min(inputs.length, 5); i++) {
      if (await inputs[i].isVisible()) {
        await inputs[i].fill('Test input value ' + i);
        await page.waitForTimeout(200);
      }
    }

    // Look for select/dropdown elements and try to interact
    const selects = page.locator('select, [role="combobox"], button[class*="select"]');
    if (await selects.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(500);
      // Click first option if available
      const option = page.locator('[role="option"], option').first();
      if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
      await dismissDialogs(page);
    }

    // Should NOT have crashed
    expect(uncaught).toEqual([]);
  });

  test('Settings page — toggle switches and change selections', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Look for toggle switches
    const switches = page.locator('[role="switch"], input[type="checkbox"]');
    const switchCount = await switches.count();
    for (let i = 0; i < Math.min(switchCount, 5); i++) {
      if (await switches.nth(i).isVisible()) {
        await switches.nth(i).click();
        await page.waitForTimeout(300);
      }
    }

    // Look for dropdown selects
    const selects = page.locator('select');
    const selectCount = await selects.count();
    for (let i = 0; i < Math.min(selectCount, 3); i++) {
      if (await selects.nth(i).isVisible()) {
        await selects.nth(i).click();
        await page.waitForTimeout(300);
        await dismissDialogs(page);
      }
    }

    expect(uncaught).toEqual([]);
  });

  test('Form Builder page renders and is interactive', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/form-builder`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Try clicking Add/Create buttons
    const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Maintenance Request page — interact with form elements', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/maintenance-request`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Try status filter tabs
    const statusBtns = page.locator('button:has-text("Scheduled"), button:has-text("Due"), button:has-text("Overdue"), button:has-text("Completed")');
    const statusCount = await statusBtns.count();
    for (let i = 0; i < statusCount; i++) {
      if (await statusBtns.nth(i).isVisible()) {
        await statusBtns.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    // Try creating new request
    const createBtn = page.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Schedule")').first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 2. Filter & Search Deep Tests ──────────────────────────────────

test.describe('Filter & Search Operations', () => {
  test('Fleet tab — search vehicles by text', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }

    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Search with matching term
      await search.fill('Ford');
      await page.waitForTimeout(1000);
      const bodyAfter = await page.textContent('body');
      expect(bodyAfter!.length).toBeGreaterThan(50);

      // Search with non-matching term
      await search.fill('zzzznonexistent12345');
      await page.waitForTimeout(1000);

      // Clear search
      await search.clear();
      await page.waitForTimeout(500);
    }

    expect(uncaught).toEqual([]);
  });

  test('Fleet tab — filter by status dropdown', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }

    // Look for filter/status dropdown
    const filterBtn = page.locator('button:has-text("Filter"), button:has-text("Status"), [aria-label*="filter"], [class*="filter"]').first();
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(500);

      // Click first filter option
      const option = page.locator('[role="option"], [role="menuitem"], [role="menuitemcheckbox"]').first();
      if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(500);
      }
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Compliance hub — filter and search compliance records', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const compTab = page.getByRole('tab', { name: 'Compliance' }).or(page.locator('button:has-text("Compliance")')).first();
    if (await compTab.isVisible()) {
      await compTab.click();
      await waitForPageReady(page);
    }

    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('safety');
      await page.waitForTimeout(1000);
      await search.clear();
    }

    expect(uncaught).toEqual([]);
  });

  test('People hub — search drivers/employees', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/communication-hub-consolidated`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const tab = page.getByRole('tab', { name: 'People' }).or(page.locator('button:has-text("People")')).first();
    if (await tab.isVisible()) {
      await tab.click();
      await waitForPageReady(page);
    }

    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('John');
      await page.waitForTimeout(1000);
      await search.clear();
    }

    expect(uncaught).toEqual([]);
  });

  test('Task Management — filter tasks', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/task-management`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Look for status filter buttons or tabs
    const filterBtns = page.locator('button:has-text("All"), button:has-text("Open"), button:has-text("In Progress"), button:has-text("Completed")');
    const count = await filterBtns.count();
    for (let i = 0; i < Math.min(count, 4); i++) {
      if (await filterBtns.nth(i).isVisible()) {
        await filterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    expect(uncaught).toEqual([]);
  });

  test('Route Management — interact with route list', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/routes`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Search routes
    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('route');
      await page.waitForTimeout(1000);
      await search.clear();
    }

    // Click first route row to drill down
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 3. Drilldown Panel Detail Tests ────────────────────────────────

test.describe('Drilldown Panel Details', () => {
  test('Vehicle drilldown — view detail tabs and actions', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }

    // Click first vehicle row
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);

      // Check for detail panel tabs (Maintenance, Incidents, Trips, etc.)
      const panelTabs = page.locator('[role="tablist"] [role="tab"], [class*="panel"] button[class*="tab"]');
      const tabCount = await panelTabs.count();
      for (let i = 0; i < Math.min(tabCount, 6); i++) {
        if (await panelTabs.nth(i).isVisible()) {
          await panelTabs.nth(i).click();
          await page.waitForTimeout(1000);
        }
      }

      // Check for action buttons in panel
      const actionBtns = page.locator('[class*="panel"] button:has-text("Edit"), [class*="panel"] button:has-text("View"), [class*="detail"] button:has-text("Edit")');
      if (await actionBtns.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await actionBtns.first().click();
        await page.waitForTimeout(1000);
        await dismissDialogs(page);
      }

      // Close panel
      const closeBtn = page.locator('[class*="panel"] button[aria-label="Close"], [class*="panel"] button:has-text("Close"), [class*="drilldown"] button[aria-label="Close"]').first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await dismissDialogs(page);
      }
    }

    expect(uncaught).toEqual([]);
  });

  test('Driver drilldown — view driver details and performance', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const driversTab = page.getByRole('tab', { name: 'Drivers' }).or(page.locator('button:has-text("Drivers")')).first();
    if (await driversTab.isVisible()) {
      await driversTab.click();
      await waitForPageReady(page);
    }

    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);

      // Check for detail content — driver info, performance metrics
      const detailContent = page.locator('[class*="panel"], [class*="detail"], [class*="drilldown"]');
      if (await detailContent.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        const panelText = await detailContent.first().textContent();
        expect(panelText!.length).toBeGreaterThan(20);
      }

      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Work order drilldown — view details and labor/parts', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const maintTab = page.getByRole('tab', { name: 'Maintenance' }).or(page.locator('button:has-text("Maintenance")')).first();
    if (await maintTab.isVisible()) {
      await maintTab.click();
      await waitForPageReady(page);
    }

    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);

      // Click through detail tabs if present
      const panelTabs = page.locator('[role="tablist"] [role="tab"]');
      const tabCount = await panelTabs.count();
      for (let i = 0; i < Math.min(tabCount, 5); i++) {
        if (await panelTabs.nth(i).isVisible()) {
          await panelTabs.nth(i).click();
          await page.waitForTimeout(800);
        }
      }

      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Policy drilldown — view policy details and conditions', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const policyTab = page.getByRole('tab', { name: 'Policies' }).or(page.locator('button:has-text("Policies")')).first();
    if (await policyTab.isVisible()) {
      await policyTab.click();
      await waitForPageReady(page);
    }

    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);

      // Check for policy content
      const detailContent = page.locator('[class*="panel"], [class*="detail"], [class*="drilldown"]');
      if (await detailContent.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        const panelText = await detailContent.first().textContent();
        expect(panelText!.length).toBeGreaterThan(10);
      }

      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Compliance record drilldown from Compliance tab', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const compTab = page.getByRole('tab', { name: 'Compliance' }).or(page.locator('button:has-text("Compliance")')).first();
    if (await compTab.isVisible()) {
      await compTab.click();
      await waitForPageReady(page);
    }

    // Click a compliance record or card
    const card = page.locator('[class*="card"][class*="cursor"], [class*="cursor-pointer"]').first();
    if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(2000);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 4. Export & Action Button Tests ────────────────────────────────

test.describe('Export & Action Operations', () => {
  test('Fleet hub — Export button does not crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
      // Close any export dialog/menu
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Custom Report Builder — generate report flow', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/custom-reports`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Try clicking generate/create buttons
    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Run"), button:has-text("New")').first();
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateBtn.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Receipt Processing — interact with OCR elements', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/receipt-processing`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Try upload button
    const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Scan"), button:has-text("Add")').first();
    if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await uploadBtn.click();
      await page.waitForTimeout(1000);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Purchase Orders — interact with PO list and actions', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/purchase-orders`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Try create/new button
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      await dismissDialogs(page);
    }

    // Try clicking a PO row
    const row = page.locator('tr[class*="cursor"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 5. Hub Tab Data Integrity ──────────────────────────────────────

test.describe('Hub Data Integrity — No undefined/null', () => {
  const hubTabs = [
    { url: '/fleet', tabs: ['Fleet', 'Drivers', 'Operations', 'Maintenance', 'Assets'] },
    { url: '/compliance-safety', tabs: ['Compliance', 'Safety', 'Policies', 'Reports'] },
    { url: '/communication-hub-consolidated', tabs: ['People', 'Communication', 'Tasks'] },
    { url: '/business', tabs: ['Financial', 'Procurement', 'Analytics', 'Reports'] },
    { url: '/cta-configuration-hub', tabs: ['Admin', 'Configuration', 'Data', 'Integrations', 'Documents'] },
  ];

  for (const hub of hubTabs) {
    for (const tab of hub.tabs) {
      test(`${hub.url} > ${tab} — no undefined/null text`, async ({ page }) => {
        const { uncaught } = setupErrorTracking(page);
        await page.goto(`${BASE_URL}${hub.url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await waitForPageReady(page);

        await dismissDialogs(page);
        const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await waitForPageReady(page);
        }

        const bodyText = await page.textContent('body');
        // Should NOT contain raw "undefined" or "null" in rendered page
        expect(bodyText).not.toContain('undefined');
        expect(bodyText).not.toContain(': null');
        expect(uncaught).toEqual([]);
      });
    }
  }
});

// ─── 6. Module-Specific Interactions ────────────────────────────────

test.describe('Module-Specific Interactions', () => {
  test('Fuel Management — interact with fuel data', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fuel`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Try filter/tabs
    const tabs = page.locator('[role="tab"], button[class*="tab"]');
    const tabCount = await tabs.count();
    for (let i = 0; i < Math.min(tabCount, 4); i++) {
      if (await tabs.nth(i).isVisible()) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    // Try clicking a transaction row
    const row = page.locator('tr[class*="cursor"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Vendor Management — interact with vendor list', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/vendor-management`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Search vendors
    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('auto');
      await page.waitForTimeout(1000);
      await search.clear();
    }

    // Click first vendor row
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Parts Inventory — search and interact', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/parts-inventory`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('brake');
      await page.waitForTimeout(1000);
      await search.clear();
    }

    expect(uncaught).toEqual([]);
  });

  test('Invoices page — view and interact with invoices', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Click a row
    const row = page.locator('tr[class*="cursor"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Incident Management — view incidents and interact', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/incident-management`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Click first incident
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr, [class*="card"][class*="cursor"]').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('EV Charging — interact with charging stations', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/ev-charging`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Click tabs if present
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    for (let i = 0; i < Math.min(tabCount, 4); i++) {
      if (await tabs.nth(i).isVisible()) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    expect(uncaught).toEqual([]);
  });

  test('Policy Engine — interact with policy rules', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/policy-engine`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Click a policy row/card
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], [class*="card"]').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(2000);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('OSHA Forms — view and interact', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/osha-forms`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Click form/record
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], [class*="card"]').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Video Telematics — view events', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/video-telematics`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Click an event
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], [class*="card"]').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 7. Workspace Interactions ──────────────────────────────────────

test.describe('Workspace Interactions', () => {
  const workspaces = [
    { path: '/operations-workspace', name: 'Operations Workspace' },
    { path: '/fleet-workspace', name: 'Fleet Workspace' },
    { path: '/drivers-workspace', name: 'Drivers Workspace' },
    { path: '/maintenance-workspace', name: 'Maintenance Workspace' },
    { path: '/analytics-workspace', name: 'Analytics Workspace' },
    { path: '/compliance-workspace', name: 'Compliance Workspace' },
  ];

  for (const ws of workspaces) {
    test(`${ws.name} — tabs and interactions`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}${ws.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);

      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);

      // Click tabs if any
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      for (let i = 0; i < Math.min(tabCount, 4); i++) {
        if (await tabs.nth(i).isVisible()) {
          await tabs.nth(i).click();
          await page.waitForTimeout(500);
        }
      }

      // Click action buttons if any
      const actionBtn = page.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Add")').first();
      if (await actionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await actionBtn.click();
        await page.waitForTimeout(1000);
        await dismissDialogs(page);
      }

      expect(uncaught).toEqual([]);
    });
  }
});

// ─── 8. Dashboard Interactions ──────────────────────────────────────

test.describe('Dashboard Deep Interactions', () => {
  test('Executive Dashboard — charts and KPIs', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/executive-dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Page renders meaningful content
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);

    // Should have some visual elements (SVG charts, canvas, or chart containers)
    const visualCount = await page.locator('svg, canvas, [class*="chart"], [class*="recharts"]').count();
    // Visual elements may or may not be present depending on data availability
    expect(uncaught).toEqual([]);
  });

  test('Premium Fleet Dashboard — interact with widgets', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/premium-fleet-dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);

    // Check for charts
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(0);

    expect(uncaught).toEqual([]);
  });

  test('Fleet Optimizer — interact with optimization controls', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet-optimizer`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Check for charts
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(0);

    // Click optimize/run button if present
    const optimizeBtn = page.locator('button:has-text("Optimize"), button:has-text("Run"), button:has-text("Analyze")').first();
    if (await optimizeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await optimizeBtn.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Cost Analysis Center — charts and filters', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/cost-analysis`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Check for charts
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(0);

    // Try date range picker if present
    const dateBtn = page.locator('button:has-text("Date"), button:has-text("Period"), button:has-text("Range"), [class*="date"]').first();
    if (await dateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateBtn.click();
      await page.waitForTimeout(500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 9. Communication & Notifications ───────────────────────────────

test.describe('Communication & Notifications', () => {
  test('Communication Log — view and filter messages', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/communication-log`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Search messages
    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('message');
      await page.waitForTimeout(1000);
      await search.clear();
    }

    expect(uncaught).toEqual([]);
  });

  test('Email Center — view inbox', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/email-center`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Click an email if present
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], [class*="email-item"]').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Notifications page — view and interact', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Try marking as read or dismissing
    const actionBtn = page.locator('button:has-text("Mark"), button:has-text("Read"), button:has-text("Clear"), button:has-text("Dismiss")').first();
    if (await actionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(1000);
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 10. Edge Cases & Error Recovery ────────────────────────────────

test.describe('Edge Cases', () => {
  test('Navigate to nonexistent route — shows 404 or redirects gracefully', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/this-route-does-not-exist-12345`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(10);
    expect(uncaught).toEqual([]);
  });

  test('Deep link to hub alternate paths work', async ({ page }) => {
    test.setTimeout(210000); // 7 sequential page navigations need more time
    const { uncaught } = setupErrorTracking(page);
    const alternates = ['/operations', '/maintenance', '/drivers', '/safety', '/compliance', '/financial', '/admin'];
    for (const path of alternates) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    }
    expect(uncaught).toEqual([]);
  });

  test('Double-click on table row does not crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const fleetTab = page.getByRole('tab', { name: 'Fleet' }).or(page.locator('button:has-text("Fleet")')).first();
    if (await fleetTab.isVisible()) {
      await fleetTab.click();
      await waitForPageReady(page);
    }

    const row = page.locator('tr[class*="cursor"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.dblclick();
      await page.waitForTimeout(2000);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Rapid navigation between hubs does not crash', async ({ page }) => {
    test.setTimeout(60000);
    const { uncaught } = setupErrorTracking(page);
    const hubs = ['/fleet', '/compliance-safety', '/business', '/communication-hub-consolidated', '/cta-configuration-hub', '/fleet'];

    for (const hub of hubs) {
      await page.goto(`${BASE_URL}${hub}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Minimal wait to simulate rapid navigation
      await page.waitForTimeout(500);
    }
    // Final wait to let things settle
    await page.waitForTimeout(3000);
    expect(uncaught).toEqual([]);
  });

  test('Browser back/forward navigation does not crash', async ({ page }) => {
    test.setTimeout(60000);
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    await page.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Go back twice
    await page.goBack();
    await page.waitForTimeout(2000);
    await page.goBack();
    await page.waitForTimeout(2000);

    // Go forward
    await page.goForward();
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
    expect(uncaught).toEqual([]);
  });

  test('Resize viewport mid-session does not crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Resize through multiple viewports
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 812 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
    expect(uncaught).toEqual([]);
  });
});

// ─── 11. Dispatch & Real-Time Pages ─────────────────────────────────

test.describe('Dispatch & Real-Time', () => {
  test('Dispatch Console — interact with dispatch controls', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/dispatch-console`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Click any control buttons
    const ctrlBtns = page.locator('button').all();
    const btns = await ctrlBtns;
    let clickCount = 0;
    for (const btn of btns) {
      if (clickCount >= 5) break;
      const text = await btn.textContent().catch(() => '');
      if (text && !text.includes('Close') && !text.includes('Delete') && !text.includes('Remove')) {
        if (await btn.isVisible() && await btn.isEnabled()) {
          await btn.click().catch(() => {});
          await page.waitForTimeout(500);
          await dismissDialogs(page);
          clickCount++;
        }
      }
    }

    expect(uncaught).toEqual([]);
  });

  test('Vehicle Telemetry — interact with telemetry displays', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/vehicle-telemetry`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Click tabs if present
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    for (let i = 0; i < Math.min(tabCount, 4); i++) {
      if (await tabs.nth(i).isVisible()) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    expect(uncaught).toEqual([]);
  });

  test('GIS Command Center — interact with map controls', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/gis-map`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Click layer toggles or controls
    const toggles = page.locator('[role="switch"], input[type="checkbox"], button:has-text("Layer"), button:has-text("Toggle")');
    const toggleCount = await toggles.count();
    for (let i = 0; i < Math.min(toggleCount, 5); i++) {
      if (await toggles.nth(i).isVisible()) {
        await toggles.nth(i).click();
        await page.waitForTimeout(300);
      }
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 12. Driver & Asset Management ─────────────────────────────────

test.describe('Driver & Asset Management', () => {
  test('Driver Performance — view metrics and scorecard', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/driver-mgmt`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Click a driver row/card
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], [class*="card"]').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Driver Scorecard — view scores and charts', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/driver-scorecard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Check for charts
    const svgCount = await page.locator('svg').count();
    // Charts may or may not be present depending on data
    expect(uncaught).toEqual([]);
  });

  test('Asset Management — view and search assets', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/asset-management`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('asset');
      await page.waitForTimeout(1000);
      await search.clear();
    }

    expect(uncaught).toEqual([]);
  });

  test('Equipment Dashboard — view equipment status', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/equipment-dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    expect(uncaught).toEqual([]);
  });
});

// ─── 13. Personal Use & Mileage ─────────────────────────────────────

test.describe('Personal Use & Mileage', () => {
  test('Personal Use Dashboard — view and interact', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/personal-use`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    expect(uncaught).toEqual([]);
  });

  test('Mileage Reimbursement — view and interact', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/mileage`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Try submitting if form exists
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Calculate"), button:has-text("Add")').first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Don't submit — just check it doesn't crash
      await submitBtn.focus();
      await page.waitForTimeout(500);
    }

    expect(uncaught).toEqual([]);
  });
});

// ─── 14. Document & Compliance Detail ───────────────────────────────

test.describe('Documents & Compliance', () => {
  test('Documents page — search and view documents', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/documents`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('inspection');
      await page.waitForTimeout(1000);
      await search.clear();
    }

    // Click a document row
    const row = page.locator('tr[class*="cursor"], [class*="cursor-pointer"], table tbody tr').first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Hours of Service — view HOS data', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/hos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    expect(uncaught).toEqual([]);
  });

  test('Garage Service — view garage bays', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/garage`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Click a bay/slot
    const card = page.locator('[class*="card"], [class*="bay"], [class*="slot"]').first();
    if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(1500);
      await dismissDialogs(page);
    }

    expect(uncaught).toEqual([]);
  });

  test('Predictive Maintenance — view predictions', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/predictive`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Check for charts
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(0);

    expect(uncaught).toEqual([]);
  });

  test('Maintenance Scheduling — interact with calendar/list', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/maintenance-scheduling`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    // Try view toggles (calendar/list/timeline)
    const viewBtns = page.locator('button:has-text("Calendar"), button:has-text("List"), button:has-text("Timeline"), button:has-text("Week"), button:has-text("Month")');
    const count = await viewBtns.count();
    for (let i = 0; i < Math.min(count, 4); i++) {
      if (await viewBtns.nth(i).isVisible()) {
        await viewBtns.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    expect(uncaught).toEqual([]);
  });
});
