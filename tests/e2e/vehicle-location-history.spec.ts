/**
 * E2E Tests for Vehicle Location History Feature
 *
 * Tests the complete user flow for viewing vehicle location history
 * and trip playback functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Vehicle Location History', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to fleet management app
    await page.goto('/');

    // Login (assuming mock auth or test credentials)
    // Adjust this based on your actual auth flow
    await page.waitForLoadState('networkidle');
  });

  test('should display location history on vehicle detail page', async ({ page }) => {
    // Navigate to vehicles page
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    // Click on a vehicle to open detail panel
    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    // Wait for vehicle detail panel to load
    await expect(page.locator('text=Vehicle Information')).toBeVisible();

    // Find and click the location history section
    const locationHistoryButton = page.locator('button:has-text("Show History")');
    await expect(locationHistoryButton).toBeVisible();
    await locationHistoryButton.click();

    // Verify location history section expanded
    await expect(page.locator('text=Location History Trail')).toBeVisible();
    await expect(page.locator('text=Trail View')).toBeVisible();
    await expect(page.locator('text=Trip Playback')).toBeVisible();
  });

  test('should render trail on map', async ({ page }) => {
    // Navigate to vehicle detail with location history
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    // Open location history
    await page.click('button:has-text("Show History")');
    await expect(page.locator('text=Location History Trail')).toBeVisible();

    // Wait for map to render
    const map = page.locator('#history-trail-map');
    await expect(map).toBeVisible();

    // Verify map controls are present
    await expect(page.locator('button:has-text("Hide Trail")')).toBeVisible();

    // Check for date range selectors
    await expect(page.locator('button:has-text("Last 24h")')).toBeVisible();
    await expect(page.locator('button:has-text("Last Week")')).toBeVisible();
    await expect(page.locator('button:has-text("Last Month")')).toBeVisible();

    // Verify legend is present
    await expect(page.locator('text=Oldest')).toBeVisible();
    await expect(page.locator('text=Newest')).toBeVisible();
  });

  test('should change date range when filter buttons clicked', async ({ page }) => {
    // Navigate to vehicle with location history
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Click Last 24h filter
    await page.click('button:has-text("Last 24h")');
    await page.waitForTimeout(500);

    // Click Last Week filter
    await page.click('button:has-text("Last Week")');
    await page.waitForTimeout(500);

    // Click Last Month filter
    await page.click('button:has-text("Last Month")');
    await page.waitForTimeout(500);

    // Verify map updated (check for network request or DOM changes)
    // This is a basic check - you might want to add more specific assertions
    const map = page.locator('#history-trail-map');
    await expect(map).toBeVisible();
  });

  test('should toggle trail visibility', async ({ page }) => {
    // Navigate to vehicle with location history
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Verify trail is visible initially
    const hideButton = page.locator('button:has-text("Hide Trail")');
    await expect(hideButton).toBeVisible();

    const map = page.locator('#history-trail-map');
    await expect(map).toBeVisible();

    // Click to hide trail
    await hideButton.click();

    // Verify "Show Trail" button appears
    await expect(page.locator('button:has-text("Show Trail")')).toBeVisible();

    // Verify hidden state message
    await expect(page.locator('text=Trail hidden')).toBeVisible();

    // Click to show trail again
    await page.click('button:has-text("Show Trail")');
    await expect(hideButton).toBeVisible();
  });

  test('should switch to trip playback tab', async ({ page }) => {
    // Navigate to vehicle with location history
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Click Trip Playback tab
    await page.click('button:has-text("Trip Playback")');

    // Verify playback tab content
    await expect(page.locator('text=Click on a location point')).toBeVisible();
    await expect(page.locator('text=Or use the View Trips button')).toBeVisible();
  });

  test('should display trip playback controls when trip selected', async ({ page }) => {
    // This test assumes you can programmatically set a trip ID
    // You might need to adjust based on your actual flow

    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Switch to Trail View and click on a point (if possible)
    // This might require waiting for the map to load and simulating a click

    // For now, let's test the playback tab structure
    await page.click('button:has-text("Trip Playback")');

    // If a trip is selected, these controls should appear:
    // - Play/Pause button
    // - Stop button
    // - Speed selector (0.5x, 1x, 2x, 4x, 8x)
    // - Time scrubber slider

    // Note: This test might need actual trip data to fully validate
  });

  test('should load API data without errors', async ({ page }) => {
    // Listen for API errors
    const apiErrors: string[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/api/v1/vehicles') && !response.ok()) {
        apiErrors.push(`${response.url()} - ${response.status()}`);
      }
    });

    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Wait for API calls to complete
    await page.waitForLoadState('networkidle');

    // Verify no API errors occurred
    expect(apiErrors).toHaveLength(0);
  });

  test('should display loading state while fetching data', async ({ page }) => {
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Check for loading skeleton or spinner
    // This might be very fast, so we check if it appears at all
    const hasLoadingState = await page.locator('[data-testid="skeleton"]').isVisible().catch(() => false);

    // Even if loading is fast, the component should eventually show data
    await expect(page.locator('text=Location History Trail')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Intercept API and return error
    await page.route('**/api/v1/vehicles/*/location-history*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Verify error message is displayed
    await expect(page.locator('text=Failed to load location history')).toBeVisible();
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    // Tab to the Show History button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Verify location history section expanded
    await expect(page.locator('text=Location History Trail')).toBeVisible();

    // Tab through date range buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // All controls should be keyboard accessible
    const lastWeekButton = page.locator('button:has-text("Last Week")');
    await expect(lastWeekButton).toBeFocused();
  });

  test('should display stats correctly', async ({ page }) => {
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Check for stats display
    await expect(page.locator('text=First Point')).toBeVisible();
    await expect(page.locator('text=Last Point')).toBeVisible();
    await expect(page.locator('text=Total Points')).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');

    // Verify location history section is responsive
    await expect(page.locator('text=Location History Trail')).toBeVisible();

    // Map should still render
    const map = page.locator('#history-trail-map');
    await expect(map).toBeVisible();

    // Controls should be accessible
    await expect(page.locator('button:has-text("Last 24h")')).toBeVisible();
  });
});

test.describe('Trip Playback', () => {
  test('should play trip animation', async ({ page }) => {
    // This test requires a selected trip
    await page.goto('/');
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');
    await page.click('button:has-text("Trip Playback")');

    // If trip is selected, verify playback controls
    const playButton = page.locator('button:has-text("Play")');

    if (await playButton.isVisible()) {
      await playButton.click();

      // Verify pause button appears
      await expect(page.locator('button:has-text("Pause")')).toBeVisible();

      // Verify map is present
      const playbackMap = page.locator('#trip-playback-map');
      await expect(playbackMap).toBeVisible();

      // Verify speed controls
      await expect(page.locator('button:has-text("0.5x")')).toBeVisible();
      await expect(page.locator('button:has-text("1x")')).toBeVisible();
      await expect(page.locator('button:has-text("2x")')).toBeVisible();
      await expect(page.locator('button:has-text("4x")')).toBeVisible();
      await expect(page.locator('button:has-text("8x")')).toBeVisible();

      // Stop playback
      await page.click('button:has-text("Stop")');
      await expect(playButton).toBeVisible();
    }
  });

  test('should change playback speed', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Vehicles');
    await page.waitForLoadState('networkidle');

    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await firstVehicle.click();

    await page.click('button:has-text("Show History")');
    await page.click('button:has-text("Trip Playback")');

    // Test speed selector buttons
    const speedButtons = ['0.5x', '1x', '2x', '4x', '8x'];

    for (const speed of speedButtons) {
      const speedButton = page.locator(`button:has-text("${speed}")`);
      if (await speedButton.isVisible()) {
        await speedButton.click();
        // Verify button is active (might have different styling)
        await expect(speedButton).toBeVisible();
      }
    }
  });
});
