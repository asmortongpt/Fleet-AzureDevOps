/**
 * Visual Regression Tests for Main Application Pages
 *
 * Tests critical page layouts and UI states:
 * - Dashboard (KPIs, charts, real-time data)
 * - Fleet Management (vehicle list, grid, maps)
 * - Driver Management (driver list, profiles)
 * - Maintenance (service records, schedules)
 *
 * Run with: npx percy exec -- npx playwright test tests/visual/pages/main-pages.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import {
  takePerrySnapshot,
  disableAnimations,
  waitForNetworkIdle,
  BREAKPOINTS,
  hideSelectors,
} from '../helpers/visual-test-utils';

const baseUrl = 'http://localhost:5173';

// Helper to wait for dashboard to load
async function waitForDashboardLoad(page: Page) {
  try {
    await Promise.race([
      page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 }),
      page.waitForSelector('.dashboard-main', { timeout: 10000 }),
      page.waitForTimeout(5000),
    ]);
  } catch {
    // Dashboard might not have these selectors, continue
  }
  await waitForNetworkIdle(page);
}

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await disableAnimations(page);
  });

  test('dashboard - desktop layout', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
    await waitForDashboardLoad(page);

    // Hide dynamic timestamps and data that might change
    await hideSelectors(page, [
      '[data-testid="last-updated"]',
      '.timestamp',
      '.dynamic-value',
    ]).catch(() => {});

    await page.setViewportSize(BREAKPOINTS.desktop);
    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Dashboard - Desktop',
      breakpoints: ['desktop'],
    });
  });

  test('dashboard - tablet layout', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
    await waitForDashboardLoad(page);

    await hideSelectors(page, [
      '[data-testid="last-updated"]',
      '.timestamp',
    ]).catch(() => {});

    await page.setViewportSize(BREAKPOINTS.tablet);
    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Dashboard - Tablet',
      breakpoints: ['tablet'],
    });
  });

  test('dashboard - mobile layout', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
    await waitForDashboardLoad(page);

    await hideSelectors(page, [
      '[data-testid="last-updated"]',
      '.timestamp',
    ]).catch(() => {});

    await page.setViewportSize(BREAKPOINTS.mobile);
    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Dashboard - Mobile',
      breakpoints: ['mobile'],
      minHeight: 1200,
    });
  });

  test('dashboard - KPI cards area', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
    await waitForDashboardLoad(page);

    // Focus on KPI section
    const kpiSection = await page.$('[data-testid="kpi-section"], .kpi-container, [class*="kpi"]');
    if (kpiSection) {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(300);
    }

    await takePerrySnapshot(page, {
      name: 'Dashboard - KPI Cards',
      breakpoints: ['mobile', 'tablet', 'desktop'],
    });
  });

  test('dashboard - charts area', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
    await waitForDashboardLoad(page);

    // Scroll to charts area if it exists below KPIs
    await page.evaluate(() => {
      const chartElements = document.querySelectorAll('[class*="chart"], [class*="graph"]');
      if (chartElements.length > 0) {
        chartElements[0].scrollIntoView({ behavior: 'instant' });
      }
    }).catch(() => {});

    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Dashboard - Charts',
      breakpoints: ['mobile', 'tablet', 'desktop'],
    });
  });

  test('dashboard - alerts and notifications', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
    await waitForDashboardLoad(page);

    // Scroll to alerts area
    await page.evaluate(() => {
      const alertElements = document.querySelectorAll('[class*="alert"], [class*="notification"]');
      if (alertElements.length > 0) {
        alertElements[0].scrollIntoView({ behavior: 'instant' });
      }
    }).catch(() => {});

    await takePerrySnapshot(page, {
      name: 'Dashboard - Alerts and Notifications',
      breakpoints: ['mobile', 'desktop'],
    });
  });
});

test.describe('Fleet Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await disableAnimations(page);
  });

  test('fleet - list view desktop', async ({ page }) => {
    await page.goto(`${baseUrl}/fleet`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="vehicle"], [data-testid*="vehicle"]', {
        timeout: 5000,
      });
    } catch {
      // List might not have loaded yet
    }

    await hideSelectors(page, ['.timestamp', '[data-testid="last-sync"]']).catch(
      () => {}
    );

    await page.setViewportSize(BREAKPOINTS.desktop);

    await takePerrySnapshot(page, {
      name: 'Fleet - List View Desktop',
      breakpoints: ['desktop'],
    });
  });

  test('fleet - list view tablet', async ({ page }) => {
    await page.goto(`${baseUrl}/fleet`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="vehicle"]', { timeout: 5000 });
    } catch {}

    await hideSelectors(page, ['.timestamp', '[data-testid="last-sync"]']).catch(
      () => {}
    );

    await page.setViewportSize(BREAKPOINTS.tablet);
    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Fleet - List View Tablet',
      breakpoints: ['tablet'],
    });
  });

  test('fleet - list view mobile', async ({ page }) => {
    await page.goto(`${baseUrl}/fleet`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="vehicle"]', { timeout: 5000 });
    } catch {}

    await page.setViewportSize(BREAKPOINTS.mobile);
    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Fleet - List View Mobile',
      breakpoints: ['mobile'],
      minHeight: 1200,
    });
  });

  test('fleet - grid view', async ({ page }) => {
    await page.goto(`${baseUrl}/fleet?view=grid`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="grid"], [class*="card"]', { timeout: 5000 });
    } catch {}

    await page.setViewportSize(BREAKPOINTS.desktop);

    await takePerrySnapshot(page, {
      name: 'Fleet - Grid View',
      breakpoints: ['desktop', 'tablet'],
    });
  });

  test('fleet - map view', async ({ page }) => {
    await page.goto(`${baseUrl}/fleet?view=map`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="map"], [class*="leaflet"]', { timeout: 8000 });
      await page.waitForTimeout(1000); // Wait for map to render
    } catch {}

    await page.setViewportSize(BREAKPOINTS.desktop);

    await takePerrySnapshot(page, {
      name: 'Fleet - Map View',
      breakpoints: ['desktop', 'tablet'],
    });
  });

  test('fleet - filters and controls', async ({ page }) => {
    await page.goto(`${baseUrl}/fleet`, { waitUntil: 'networkidle' });

    // Look for filter panel
    const filterPanel = await page.$('[class*="filter"], [class*="sidebar"]');
    if (filterPanel) {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    }

    await takePerrySnapshot(page, {
      name: 'Fleet - Filters and Controls',
      breakpoints: ['mobile', 'tablet', 'desktop'],
    });
  });
});

test.describe('Driver Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await disableAnimations(page);
  });

  test('drivers - list view desktop', async ({ page }) => {
    await page.goto(`${baseUrl}/drivers`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="driver"], [data-testid*="driver"]', {
        timeout: 5000,
      });
    } catch {}

    await hideSelectors(page, ['.timestamp', '.last-active']).catch(() => {});

    await page.setViewportSize(BREAKPOINTS.desktop);

    await takePerrySnapshot(page, {
      name: 'Drivers - List View Desktop',
      breakpoints: ['desktop'],
    });
  });

  test('drivers - list view mobile', async ({ page }) => {
    await page.goto(`${baseUrl}/drivers`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="driver"]', { timeout: 5000 });
    } catch {}

    await page.setViewportSize(BREAKPOINTS.mobile);
    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Drivers - List View Mobile',
      breakpoints: ['mobile'],
      minHeight: 1200,
    });
  });

  test('drivers - driver profile', async ({ page }) => {
    await page.goto(`${baseUrl}/drivers`, { waitUntil: 'networkidle' });

    try {
      // Click first driver to open profile
      const firstDriver = await page.$('[class*="driver-row"], [class*="driver-card"]');
      if (firstDriver) {
        await firstDriver.click();
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }).catch(
          () => {}
        );
      }
    } catch {}

    await hideSelectors(page, ['.timestamp', '.last-updated']).catch(() => {});

    await page.setViewportSize(BREAKPOINTS.desktop);

    await takePerrySnapshot(page, {
      name: 'Drivers - Profile Details',
      breakpoints: ['mobile', 'desktop'],
    });
  });

  test('drivers - performance metrics', async ({ page }) => {
    await page.goto(`${baseUrl}/drivers`, { waitUntil: 'networkidle' });

    // Scroll to metrics section
    await page.evaluate(() => {
      const metricsSection = document.querySelector('[class*="metric"], [class*="stats"]');
      if (metricsSection) {
        metricsSection.scrollIntoView({ behavior: 'instant' });
      }
    }).catch(() => {});

    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Drivers - Performance Metrics',
      breakpoints: ['mobile', 'tablet', 'desktop'],
    });
  });
});

test.describe('Maintenance & Telematics Page', () => {
  test.beforeEach(async ({ page }) => {
    await disableAnimations(page);
  });

  test('maintenance - schedule view', async ({ page }) => {
    await page.goto(`${baseUrl}/maintenance`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="schedule"], [class*="maintenance"]', {
        timeout: 5000,
      });
    } catch {}

    await hideSelectors(page, ['.timestamp', '.due-date']).catch(() => {});

    await page.setViewportSize(BREAKPOINTS.desktop);

    await takePerrySnapshot(page, {
      name: 'Maintenance - Schedule View',
      breakpoints: ['desktop', 'tablet'],
    });
  });

  test('maintenance - mobile view', async ({ page }) => {
    await page.goto(`${baseUrl}/maintenance`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="maintenance"]', { timeout: 5000 });
    } catch {}

    await page.setViewportSize(BREAKPOINTS.mobile);
    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Maintenance - Mobile View',
      breakpoints: ['mobile'],
      minHeight: 1200,
    });
  });

  test('maintenance - service records', async ({ page }) => {
    await page.goto(`${baseUrl}/maintenance`, { waitUntil: 'networkidle' });

    // Scroll to service history section
    await page.evaluate(() => {
      const historySection = document.querySelector('[class*="history"], [class*="records"]');
      if (historySection) {
        historySection.scrollIntoView({ behavior: 'instant' });
      }
    }).catch(() => {});

    await takePerrySnapshot(page, {
      name: 'Maintenance - Service Records',
      breakpoints: ['mobile', 'tablet', 'desktop'],
    });
  });

  test('telematics - data view', async ({ page }) => {
    await page.goto(`${baseUrl}/telematics`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('[class*="telematics"], [class*="data"]', {
        timeout: 5000,
      });
    } catch {}

    await hideSelectors(page, ['.timestamp', '.last-update']).catch(() => {});

    await takePerrySnapshot(page, {
      name: 'Telematics - Data View',
      breakpoints: ['mobile', 'tablet', 'desktop'],
    });
  });
});

test.describe('Common Page Elements', () => {
  test('page header and navigation', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    // Capture header area
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    // Take snapshot of header area
    const headerHeight = await page.evaluate(() => {
      const header = document.querySelector('header, nav, [class*="header"]');
      return header?.clientHeight || 80;
    });

    await takePerrySnapshot(page, {
      name: 'Page Header and Navigation',
      breakpoints: ['mobile', 'tablet', 'desktop'],
      minHeight: Math.max(headerHeight + 100, 200),
    });
  });

  test('sidebar menu', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    // Check if sidebar exists
    const sidebar = await page.$('[class*="sidebar"], aside, [class*="menu"]');
    if (sidebar) {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      await takePerrySnapshot(page, {
        name: 'Sidebar Menu',
        breakpoints: ['tablet', 'desktop'],
      });
    }
  });

  test('footer', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: 'Footer',
      breakpoints: ['mobile', 'desktop'],
    });
  });
});

test.describe('Error and Empty States', () => {
  test('error page layout', async ({ page }) => {
    // Try to navigate to non-existent page
    await page.goto(`${baseUrl}/non-existent-page-12345`, {
      waitUntil: 'networkidle',
    });

    await takePerrySnapshot(page, {
      name: 'Error Page - 404',
      breakpoints: ['mobile', 'tablet', 'desktop'],
    });
  });

  test('loading state placeholder', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });

    // Take snapshot before full load
    await takePerrySnapshot(page, {
      name: 'Loading State',
      breakpoints: ['desktop'],
    });
  });
});

test.describe('Responsive Breakpoint Tests', () => {
  test('dashboard responsiveness - all breakpoints', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
    await waitForDashboardLoad(page);

    for (const [breakpointKey, breakpoint] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.waitForTimeout(500);

      await takePerrySnapshot(page, {
        name: `Dashboard Responsive - ${breakpoint.name}`,
        breakpoints: [breakpointKey as any],
      });
    }
  });

  test('fleet responsiveness - all breakpoints', async ({ page }) => {
    await page.goto(`${baseUrl}/fleet`, { waitUntil: 'networkidle' });

    for (const [breakpointKey, breakpoint] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.waitForTimeout(500);

      await takePerrySnapshot(page, {
        name: `Fleet Responsive - ${breakpoint.name}`,
        breakpoints: [breakpointKey as any],
      });
    }
  });
});
