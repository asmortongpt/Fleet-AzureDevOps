import { test, expect } from '@playwright/test';

test.describe('Work Hub Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/hubs/work');
    await page.waitForLoadState('networkidle');
  });

  test('should display Work Hub with all 6 module buttons', async ({ page }) => {
    // Check for module buttons in sidebar
    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByText('Task Management')).toBeVisible();
    await expect(page.getByText('Enhanced Tasks')).toBeVisible();
    await expect(page.getByText('Route Management')).toBeVisible();
    await expect(page.getByText('Maintenance Scheduling')).toBeVisible();
    await expect(page.getByText('Maintenance Requests')).toBeVisible();
  });

  test('should display overview dashboard with stats', async ({ page }) => {
    // Check for overview cards
    await expect(page.getByText('Active Tasks')).toBeVisible();
    await expect(page.getByText('Maintenance Scheduled')).toBeVisible();
    await expect(page.getByText('Active Routes')).toBeVisible();
    await expect(page.getByText('Recent Work Activity')).toBeVisible();
  });

  test('should navigate to Task Management module', async ({ page }) => {
    await page.getByRole('button', { name: /Task Management/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Task Management is loaded
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Task/i })).toBeVisible();
  });

  test('should navigate to Enhanced Tasks module', async ({ page }) => {
    await page.getByRole('button', { name: /Enhanced Tasks/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Enhanced Tasks is loaded
    await expect(page.locator('body')).toContainText(/Task/i);
  });

  test('should navigate to Route Management module', async ({ page }) => {
    await page.getByRole('button', { name: /Route Management/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Route Management is loaded
    await expect(page.locator('body')).toContainText(/Route/i);
  });

  test('should navigate to Maintenance Scheduling module', async ({ page }) => {
    await page.getByRole('button', { name: /Maintenance Scheduling/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Maintenance Scheduling is loaded
    await expect(page.locator('body')).toContainText(/Maintenance/i);
  });

  test('should navigate to Maintenance Requests module', async ({ page }) => {
    await page.getByRole('button', { name: /Maintenance Requests/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Maintenance Requests is loaded
    await expect(page.locator('body')).toContainText(/Maintenance/i);
  });

  test('should display Quick Stats sidebar section', async ({ page }) => {
    await expect(page.getByText('Quick Stats')).toBeVisible();
    await expect(page.getByText('Tasks Today')).toBeVisible();
    await expect(page.getByText('Pending Maintenance')).toBeVisible();
    await expect(page.getByText('Active Routes')).toBeVisible();
    await expect(page.getByText('Overdue Items')).toBeVisible();
  });
});

test.describe('People Hub Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/hubs/people');
    await page.waitForLoadState('networkidle');
  });

  test('should display People Hub with all 6 module buttons', async ({ page }) => {
    // Check for module buttons in sidebar
    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByText('People Management')).toBeVisible();
    await expect(page.getByText('Driver Performance')).toBeVisible();
    await expect(page.getByText('Driver Scorecard')).toBeVisible();
    await expect(page.getByText('Employee Mobile')).toBeVisible();
    await expect(page.getByText('Manager Mobile')).toBeVisible();
  });

  test('should display overview dashboard with stats', async ({ page }) => {
    // Check for overview cards
    await expect(page.getByText('Total Drivers')).toBeVisible();
    await expect(page.getByText('Licensed & Certified')).toBeVisible();
    await expect(page.getByText('Avg Performance')).toBeVisible();
    await expect(page.getByText('Needs Attention')).toBeVisible();
    await expect(page.getByText('Top Performers This Month')).toBeVisible();
  });

  test('should navigate to People Management module', async ({ page }) => {
    await page.getByRole('button', { name: /People Management/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify People Management is loaded
    await expect(page.locator('h1, h2, h3').filter({ hasText: /People/i })).toBeVisible();
  });

  test('should navigate to Driver Performance module', async ({ page }) => {
    await page.getByRole('button', { name: /Driver Performance/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Driver Performance is loaded
    await expect(page.locator('body')).toContainText(/Performance|Driver/i);
  });

  test('should navigate to Driver Scorecard module', async ({ page }) => {
    await page.getByRole('button', { name: /Driver Scorecard/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Driver Scorecard is loaded
    await expect(page.locator('body')).toContainText(/Scorecard|Driver/i);
  });

  test('should navigate to Employee Mobile module', async ({ page }) => {
    await page.getByRole('button', { name: /Employee Mobile/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Employee Mobile is loaded
    await expect(page.locator('body')).toContainText(/Employee|Mobile/i);
  });

  test('should navigate to Manager Mobile module', async ({ page }) => {
    await page.getByRole('button', { name: /Manager Mobile/i }).click();
    await page.waitForLoadState('networkidle');
    // Verify Manager Mobile is loaded
    await expect(page.locator('body')).toContainText(/Manager|Mobile/i);
  });

  test('should display Quick Stats sidebar section', async ({ page }) => {
    await expect(page.getByText('Quick Stats')).toBeVisible();
    await expect(page.getByText('Active Drivers')).toBeVisible();
    await expect(page.getByText('Certified')).toBeVisible();
    await expect(page.getByText('In Training')).toBeVisible();
    await expect(page.getByText('Avg Score')).toBeVisible();
  });

  test('should display Actions sidebar section', async ({ page }) => {
    await expect(page.getByText('Actions')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Driver/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Check Certifications/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Schedule Training/i })).toBeVisible();
  });
});
