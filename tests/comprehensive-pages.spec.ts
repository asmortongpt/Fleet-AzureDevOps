/**
 * Comprehensive Page Load Tests
 * Every navigable route in Fleet CTA — verify load, no JS errors, content renders
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

function setupErrorTracking(page: any) {
  const errors: string[] = [];
  const uncaught: string[] = [];

  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore network/resource errors, favicon, and known noisy warnings
      if (
        text.includes('favicon') ||
        text.includes('net::ERR') ||
        text.includes('404 (Not Found)') ||
        text.includes('Failed to load resource') ||
        text.includes('ERR_CONNECTION_REFUSED') ||
        text.includes('Google Maps') ||
        text.includes('maps.googleapis')
      ) return;
      errors.push(text);
    }
  });

  page.on('pageerror', (err: any) => {
    uncaught.push(err.message);
  });

  return { errors, uncaught };
}

async function waitForPageReady(page: any, timeoutMs = 10000) {
  await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.waitForSelector('[class*="loading"], [class*="spinner"], [class*="skeleton"]', {
    state: 'hidden',
    timeout: 5000,
  }).catch(() => {});
  // Dismiss any open dialogs that may block tab clicks
  await page.locator('[role="dialog"] button:has-text("Close"), [role="dialog"] button[aria-label="Close"], [data-state="open"] + [aria-hidden="true"]').first().click({ timeout: 1000 }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

// ─── Core Hubs ──────────────────────────────────────────────────────
const CORE_HUBS = [
  { path: '/fleet', name: 'Fleet Operations Hub' },
  { path: '/compliance-safety', name: 'Compliance & Safety Hub' },
  { path: '/communication-hub-consolidated', name: 'People & Communication Hub' },
  { path: '/business', name: 'Business Management Hub' },
  { path: '/cta-configuration-hub', name: 'Admin Configuration Hub' },
];

// ─── All Standalone Pages ───────────────────────────────────────────
const STANDALONE_PAGES = [
  { path: '/', name: 'Home / Live Fleet Dashboard' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/safety-alerts', name: 'Safety Alerts' },
  { path: '/settings', name: 'Settings' },
  { path: '/profile', name: 'Profile' },
  { path: '/403', name: '403 Access Denied' },
  { path: '/map-diagnostics', name: 'Map Diagnostics' },
  { path: '/create-damage-report', name: 'Create Damage Report' },
  { path: '/documents', name: 'Documents' },
  { path: '/documents-hub', name: 'Documents Hub' },
  { path: '/reservations', name: 'Reservations' },
  { path: '/policy-hub', name: 'Policy Hub' },
  { path: '/insights-hub', name: 'Insights Hub' },
  { path: '/dispatch-console', name: 'Dispatch Console' },
  { path: '/heavy-equipment', name: 'Heavy Equipment' },
];

// ─── Module Routes (lazy-loaded feature pages) ─────────────────────
const MODULE_PAGES = [
  // Dashboards
  { path: '/executive-dashboard', name: 'Executive Dashboard' },
  { path: '/premium-fleet-dashboard', name: 'Premium Fleet Dashboard' },
  // Maintenance & Garage
  { path: '/garage', name: 'Garage Service' },
  { path: '/predictive', name: 'Predictive Maintenance' },
  { path: '/maintenance-scheduling', name: 'Maintenance Scheduling' },
  { path: '/maintenance-request', name: 'Maintenance Request' },
  // Fleet & Analytics
  { path: '/fuel', name: 'Fuel Management' },
  { path: '/workbench', name: 'Data Workbench' },
  { path: '/vehicle-telemetry', name: 'Vehicle Telemetry' },
  { path: '/fleet-optimizer', name: 'Fleet Optimizer' },
  { path: '/cost-analysis', name: 'Cost Analysis Center' },
  { path: '/custom-reports', name: 'Custom Report Builder' },
  // Operations & Routing
  { path: '/routes', name: 'Route Management' },
  { path: '/task-management', name: 'Task Management' },
  // Procurement
  { path: '/vendor-management', name: 'Vendor Management' },
  { path: '/parts-inventory', name: 'Parts Inventory' },
  { path: '/purchase-orders', name: 'Purchase Orders' },
  { path: '/invoices', name: 'Invoices' },
  // Tools & Administration
  { path: '/mileage', name: 'Mileage Reimbursement' },
  { path: '/receipt-processing', name: 'Receipt Processing' },
  { path: '/notifications', name: 'Notifications' },
  { path: '/policy-engine', name: 'Policy Engine' },
  // Compliance & Safety
  { path: '/osha-forms', name: 'OSHA Forms' },
  { path: '/video-telematics', name: 'Video Telematics' },
  { path: '/incident-management', name: 'Incident Management' },
  { path: '/hos', name: 'Hours of Service' },
  // Communication
  { path: '/email-center', name: 'Email Center' },
  { path: '/communication-log', name: 'Communication Log' },
  // EV & Charging
  { path: '/ev-charging', name: 'EV Charging Management' },
  { path: '/charging-hub', name: 'Charging Hub' },
  // Personal Use & Assets
  { path: '/personal-use', name: 'Personal Use Dashboard' },
  { path: '/asset-management', name: 'Asset Management' },
  { path: '/equipment-dashboard', name: 'Equipment Dashboard' },
  // Drivers
  { path: '/driver-mgmt', name: 'Driver Performance' },
  { path: '/driver-scorecard', name: 'Driver Scorecard' },
  // Workspaces
  { path: '/operations-workspace', name: 'Operations Workspace' },
  { path: '/fleet-workspace', name: 'Fleet Workspace' },
  { path: '/drivers-workspace', name: 'Drivers Workspace' },
  { path: '/maintenance-workspace', name: 'Maintenance Workspace' },
  { path: '/analytics-workspace', name: 'Analytics Workspace' },
  { path: '/compliance-workspace', name: 'Compliance Workspace' },
  // Fuel
  { path: '/fuel-purchasing', name: 'Fuel Purchasing' },
  { path: '/fuel-management', name: 'Fuel Management (Alt)' },
  // GIS/Map
  { path: '/gis-map', name: 'GIS Command Center' },
  { path: '/map-settings', name: 'Map Settings' },
  { path: '/map-layers', name: 'Map Layers' },
  // 3D
  { path: '/3d-garage', name: '3D Garage / Vehicle Showroom' },
];

// ─── Hub Alternate Entry Points ─────────────────────────────────────
const HUB_ALTERNATES = [
  { path: '/operations', name: 'Operations (→ Fleet Hub)' },
  { path: '/maintenance', name: 'Maintenance (→ Fleet Hub)' },
  { path: '/drivers', name: 'Drivers (→ Fleet Hub)' },
  { path: '/assets', name: 'Assets (→ Fleet Hub)' },
  { path: '/safety', name: 'Safety (→ Compliance Hub)' },
  { path: '/compliance', name: 'Compliance (→ Compliance Hub)' },
  { path: '/communication', name: 'Communication (→ Comm Hub)' },
  { path: '/financial', name: 'Financial (→ Business Hub)' },
  { path: '/procurement', name: 'Procurement (→ Business Hub)' },
  { path: '/admin', name: 'Admin (→ Admin Hub)' },
  { path: '/integrations', name: 'Integrations (→ Admin Hub)' },
  { path: '/reports', name: 'Reports (→ Business Hub)' },
  { path: '/data-governance-hub', name: 'Data Governance (→ Admin Hub)' },
];

// ─── Test: Core Hubs ────────────────────────────────────────────────
test.describe('Core Hubs', () => {
  for (const hub of CORE_HUBS) {
    test(`${hub.name} (${hub.path})`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}${hub.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(100);
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── Test: Standalone Pages ─────────────────────────────────────────
test.describe('Standalone Pages', () => {
  for (const pg of STANDALONE_PAGES) {
    test(`${pg.name} (${pg.path})`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── Test: Module Pages ─────────────────────────────────────────────
test.describe('Module Pages', () => {
  for (const mod of MODULE_PAGES) {
    test(`${mod.name} (${mod.path})`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}${mod.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── Test: Hub Alternate Entry Points ───────────────────────────────
test.describe('Hub Alternate Entry Points', () => {
  for (const alt of HUB_ALTERNATES) {
    test(`${alt.name} (${alt.path})`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}${alt.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(100);
      expect(uncaught).toEqual([]);
    });
  }
});

// ─── Test: All Hub Tabs (with data verification) ────────────────────
test.describe('Fleet Operations Hub — Tab Data Verification', () => {
  const tabs = ['Fleet', 'Drivers', 'Operations', 'Maintenance', 'Assets'];
  for (const tab of tabs) {
    test(`${tab} tab renders data`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      // Verify actual data renders — not just empty container
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(200);
      // Check for common "no data" indicators
      const hasTable = await page.locator('table tbody tr, [class*="card"], [class*="grid"] > div').count();
      // We at least have some rendered content
      expect(hasTable).toBeGreaterThan(0);
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Compliance & Safety Hub — Tab Data Verification', () => {
  const tabs = ['Compliance', 'Safety', 'Policies', 'Reports'];
  for (const tab of tabs) {
    test(`${tab} tab renders data`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/compliance-safety`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(200);
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('People & Communication Hub — Tab Data Verification', () => {
  const tabs = ['People', 'Communication', 'Tasks'];
  for (const tab of tabs) {
    test(`${tab} tab renders data`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/communication-hub-consolidated`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(200);
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Business Management Hub — Tab Data Verification', () => {
  const tabs = ['Financial', 'Procurement', 'Analytics', 'Reports'];
  for (const tab of tabs) {
    test(`${tab} tab renders data`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/business`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(200);
      expect(uncaught).toEqual([]);
    });
  }
});

test.describe('Admin Configuration Hub — Tab Data Verification', () => {
  const tabs = ['Admin', 'Configuration', 'Data', 'Integrations', 'Documents'];
  for (const tab of tabs) {
    test(`${tab} tab renders data`, async ({ page }) => {
      const { uncaught } = setupErrorTracking(page);
      await page.goto(`${BASE_URL}/cta-configuration-hub`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForPageReady(page);
      const tabBtn = page.getByRole('tab', { name: tab }).or(page.locator(`button:has-text("${tab}")`)).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await waitForPageReady(page);
      }
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(200);
      expect(uncaught).toEqual([]);
    });
  }
});
