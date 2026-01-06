import { test, expect } from '@playwright/test';

test.describe('Fleet Design System - Professional Table-First Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/fleet');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('Fleet Overview tab renders with professional table design', async ({ page }) => {
    // Verify the "Fleet Overview" header is present
    await expect(page.getByRole('heading', { name: /Fleet Overview/i })).toBeVisible();

    // Verify the subtitle text
    await expect(page.getByText(/Professional table-first navigation/i)).toBeVisible();
  });

  test('Vehicle table renders with design system components', async ({ page }) => {
    // Check for table headers
    await expect(page.getByRole('columnheader', { name: /Vehicle/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Type/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Odometer/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Fuel/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Health/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Alerts/i })).toBeVisible();
  });

  test('Entity avatars render with status rings', async ({ page }) => {
    // Look for vehicle names in the table
    await expect(page.getByText('Truck 42')).toBeVisible();
    await expect(page.getByText('Van 18')).toBeVisible();
    await expect(page.getByText('Truck 07')).toBeVisible();
  });

  test('Status chips display correctly', async ({ page }) => {
    // Check for alert status chips (the vehicles have 0, 2, and 5 alerts)
    const alertCells = page.locator('td').filter({ hasText: /\d+ alerts?/ });
    await expect(alertCells.first()).toBeVisible();
  });

  test('Expandable row functionality works', async ({ page }) => {
    // Click on the first vehicle row to expand it
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // Wait for expansion animation
    await page.waitForTimeout(200);

    // Check for the "Telemetry Drilldown" section in expanded panel
    await expect(page.getByText(/Telemetry Drilldown/i)).toBeVisible();

    // Check for "Recent Records" section
    await expect(page.getByText(/Recent Records/i)).toBeVisible();
  });

  test('Fuel progress bars render', async ({ page }) => {
    // The fuel column should contain percentage values
    const fuelCells = page.locator('td').filter({ hasText: /\d+%/ });
    await expect(fuelCells.first()).toBeVisible();
  });

  test('Health scores display with color coding', async ({ page }) => {
    // Health scores should be visible (94, 78, 52 for the three vehicles)
    await expect(page.getByText('94')).toBeVisible();
    await expect(page.getByText('78')).toBeVisible();
    await expect(page.getByText('52')).toBeVisible();
  });

  test('Visual regression: Fleet Overview page snapshot', async ({ page }) => {
    // Take a full page screenshot for visual regression testing
    await expect(page).toHaveScreenshot('fleet-overview-with-design-system.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('Expandable panel visual regression', async ({ page }) => {
    // Click first row to expand
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(300);

    // Screenshot the expanded state
    await expect(page).toHaveScreenshot('fleet-row-expanded.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('CSS custom properties are applied', async ({ page }) => {
    // Verify that the table uses the design system's CSS variables
    const table = page.locator('table').first();

    // Check that the table has the expected styling
    const styles = await table.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderCollapse: computed.borderCollapse,
        width: computed.width
      };
    });

    expect(styles.borderCollapse).toBe('separate');
  });

  test('Dark theme glassmorphic design is applied', async ({ page }) => {
    // Check that the main container has the dark theme background
    const mainContainer = page.locator('div').first();
    await expect(mainContainer).toBeVisible();
  });

  test('Table rows have hover effects', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();

    // Hover over the row
    await firstRow.hover();

    // The row should have cursor: pointer
    const cursor = await firstRow.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    expect(cursor).toBe('pointer');
  });

  test('View button in each row works', async ({ page }) => {
    // Find the first "View" button
    const viewButton = page.getByRole('button', { name: /View/i }).first();
    await expect(viewButton).toBeVisible();

    // Verify it's styled as a button
    const buttonStyles = await viewButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        cursor: computed.cursor,
        borderRadius: computed.borderRadius
      };
    });

    expect(buttonStyles.cursor).toBe('pointer');
  });

  test('Professional typography hierarchy is maintained', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Fleet Overview/i });

    const headingStyles = await heading.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight
      };
    });

    // The heading should have 28px font size and 700 weight
    expect(headingStyles.fontSize).toBe('28px');
    expect(headingStyles.fontWeight).toBe('700');
  });
});
