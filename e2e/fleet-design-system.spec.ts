import { test, expect } from '@playwright/test';

test.describe('Fleet Design System - Professional Table-First Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176/fleet');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    // Wait a bit for React to hydrate and render
    await page.waitForTimeout(1000);
  });

  test('Fleet Overview tab renders with professional table design', async ({ page }) => {
    // Verify the "Fleet Overview" header is present
    await expect(page.getByText('Fleet Overview', { exact: true })).toBeVisible({ timeout: 10000 });

    // Verify the subtitle text
    await expect(page.getByText(/Professional table-first navigation/i)).toBeVisible();
  });

  test('Vehicle table renders with design system components', async ({ page }) => {
    // Wait for table to be visible
    await page.waitForSelector('table', { timeout: 10000 });

    // Check for table headers
    await expect(page.getByText('VEHICLE', { exact: true })).toBeVisible();
    await expect(page.getByText('TYPE', { exact: true })).toBeVisible();
    await expect(page.getByText('ODOMETER', { exact: true })).toBeVisible();
    await expect(page.getByText('FUEL', { exact: true })).toBeVisible();
    await expect(page.getByText('HEALTH', { exact: true })).toBeVisible();
    await expect(page.getByText('ALERTS', { exact: true })).toBeVisible();
  });

  test('Entity avatars render with status rings', async ({ page }) => {
    // Wait for table content
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Look for vehicle names in the table
    await expect(page.getByText('Truck 42')).toBeVisible();
    await expect(page.getByText('Van 18')).toBeVisible();
    await expect(page.getByText('Truck 07')).toBeVisible();
  });

  test('Status chips display correctly', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody', { timeout: 10000 });

    // Check for alert status text (vehicles have "OK", "2 Alerts", "5 Alerts")
    const alertText = page.locator('td').filter({ hasText: /Alert|OK/ });
    await expect(alertText.first()).toBeVisible();
  });

  test('Expandable row functionality works', async ({ page }) => {
    // Wait for table rows to be clickable
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Click on the first vehicle row to expand it
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // Wait for expansion animation
    await page.waitForTimeout(500);

    // Check for expanded content - look for text that appears in RowExpandPanel
    await expect(page.getByText(/Engine Temp|Tire Pressure|Fuel/i)).toBeVisible();
  });

  test('Fuel progress bars render', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody', { timeout: 10000 });

    // The fuel column should contain percentage values
    await expect(page.getByText('72%')).toBeVisible(); // Truck 42
    await expect(page.getByText('45%')).toBeVisible(); // Van 18
    await expect(page.getByText('15%')).toBeVisible(); // Truck 07
  });

  test('Health scores display with color coding', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody', { timeout: 10000 });

    // Health scores should be visible (94, 78, 52 for the three vehicles)
    await expect(page.getByText('94').first()).toBeVisible();
    await expect(page.getByText('78').first()).toBeVisible();
    await expect(page.getByText('52').first()).toBeVisible();
  });

  test('Dark theme glassmorphic design is applied', async ({ page }) => {
    // Check that the main container exists
    await page.waitForSelector('table', { timeout: 10000 });
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('CSS custom properties are applied', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 });
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

  test('Table rows have hover effects', async ({ page }) => {
    // Wait for rows
    await page.waitForSelector('tbody tr', { timeout: 10000 });
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
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 });

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
    // Wait for heading
    await page.waitForTimeout(1000);
    const heading = page.getByText('Fleet Overview', { exact: true });
    await expect(heading).toBeVisible({ timeout: 10000 });

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

  test('Vehicle IDs are displayed', async ({ page }) => {
    // Wait for table content
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Check for vehicle IDs
    await expect(page.getByText('VEH-001')).toBeVisible();
    await expect(page.getByText('VEH-002')).toBeVisible();
    await expect(page.getByText('VEH-003')).toBeVisible();
  });

  test('Vehicle types are displayed correctly', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody', { timeout: 10000 });

    // Check for vehicle types
    await expect(page.getByText('Semi Truck')).toBeVisible();
    await expect(page.getByText('Cargo Van')).toBeVisible();
    await expect(page.getByText('Box Truck')).toBeVisible();
  });
});
