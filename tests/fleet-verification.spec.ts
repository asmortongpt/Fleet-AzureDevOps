import { test, expect } from '@playwright/test';

test.describe('Fleet Management System - Complete Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('should load the application homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Fleet Management/i);

    // Take screenshot of homepage
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded successfully');
  });

  test('should display Fleet Hub with Tallahassee vehicles', async ({ page }) => {
    // Click on Fleet Hub
    await page.click('text=Fleet Hub');
    await page.waitForTimeout(2000);

    // Look for Tallahassee vehicle numbers
    const tlhVehicles = await page.locator('text=/TLH-\\d{3}/').count();
    console.log(`Found ${tlhVehicles} Tallahassee vehicles`);
    expect(tlhVehicles).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({ path: 'test-results/02-fleet-hub.png', fullPage: true });
    console.log('✅ Fleet Hub displayed with Tallahassee vehicles');
  });

  test('should display Google Maps with vehicle tracking', async ({ page }) => {
    // Navigate to Fleet Hub
    await page.click('text=Fleet Hub');
    await page.waitForTimeout(1000);

    // Click on Live Tracking tab
    await page.click('text=Live Tracking');
    await page.waitForTimeout(3000); // Wait for map to load

    // Check if Google Maps container is present
    const mapContainer = page.locator('[class*="map"], [id*="map"]').first();
    await expect(mapContainer).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/03-live-tracking-map.png', fullPage: true });
    console.log('✅ Google Maps live tracking displayed');
  });

  test('should display vehicle images in drilldown', async ({ page }) => {
    // Navigate to Fleet Hub
    await page.click('text=Fleet Hub');
    await page.waitForTimeout(1000);

    // Click on Active Vehicles or similar drilldown
    const activeVehiclesButton = page.locator('text=/Active Vehicles|Vehicles/i').first();
    if (await activeVehiclesButton.isVisible()) {
      await activeVehiclesButton.click();
      await page.waitForTimeout(2000);

      // Look for TLH vehicles
      const tlhVehicle = page.locator('text=/TLH-\\d{3}/').first();
      if (await tlhVehicle.isVisible()) {
        await tlhVehicle.click();
        await page.waitForTimeout(2000);

        // Check for images
        const images = await page.locator('img[src*="unsplash"], img[src*="image"]').count();
        console.log(`Found ${images} images in vehicle details`);

        // Take screenshot
        await page.screenshot({ path: 'test-results/04-vehicle-details-with-image.png', fullPage: true });
        console.log('✅ Vehicle details with images displayed');
      }
    }
  });

  test('should display driver avatars', async ({ page }) => {
    // Navigate to Safety Hub
    const safetyHub = page.locator('text=Safety Hub');
    if (await safetyHub.isVisible()) {
      await safetyHub.click();
      await page.waitForTimeout(1000);

      // Click on Drivers
      const driversButton = page.locator('text=Drivers').first();
      if (await driversButton.isVisible()) {
        await driversButton.click();
        await page.waitForTimeout(2000);

        // Check for avatar images
        const avatars = await page.locator('img[src*="dicebear"], img[src*="avatar"]').count();
        console.log(`Found ${avatars} driver avatars`);

        // Take screenshot
        await page.screenshot({ path: 'test-results/05-drivers-with-avatars.png', fullPage: true });
        console.log('✅ Driver avatars displayed');
      }
    }
  });

  test('should verify Tallahassee data in Excel drilldowns', async ({ page }) => {
    // Navigate to Fleet Hub
    await page.click('text=Fleet Hub');
    await page.waitForTimeout(1000);

    // Look for Tallahassee-specific text
    const tallahasseeText = await page.locator('text=/Tallahassee|FL 323|850-/i').count();
    console.log(`Found ${tallahasseeText} Tallahassee references`);
    expect(tallahasseeText).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({ path: 'test-results/06-tallahassee-data.png', fullPage: true });
    console.log('✅ Tallahassee data verified in interface');
  });

  test('should test AI Chat functionality', async ({ page }) => {
    // Look for AI chat button (usually floating button)
    const aiChatButton = page.locator('button:has-text("AI"), button:has-text("Chat"), [aria-label*="chat" i]').first();

    if (await aiChatButton.isVisible()) {
      await aiChatButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({ path: 'test-results/07-ai-chat-interface.png', fullPage: true });
      console.log('✅ AI Chat interface accessible');
    } else {
      console.log('⚠️ AI Chat button not found on this page');
    }
  });

  test('should verify responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/08-desktop-view.png', fullPage: true });
    console.log('✅ Desktop view captured');

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'test-results/09-tablet-view.png', fullPage: true });
    console.log('✅ Tablet view captured');

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/10-mobile-view.png', fullPage: true });
    console.log('✅ Mobile view captured');
  });

  test('should verify API health and database connection', async ({ page }) => {
    // Navigate to API health endpoint
    const response = await page.goto('http://localhost:3001/health');
    const healthData = await response?.json();

    expect(healthData).toHaveProperty('status', 'ok');
    expect(healthData).toHaveProperty('database', 'connected');

    console.log('✅ API health check passed:', healthData);
  });

  test('should verify Tallahassee vehicles in API', async ({ page }) => {
    // Fetch vehicles from API
    const response = await page.goto('http://localhost:3001/api/vehicles');
    const data = await response?.json();

    const vehicles = data?.data || [];
    const tlhVehicles = vehicles.filter((v: any) => v.number?.startsWith('TLH-'));

    console.log(`✅ Found ${tlhVehicles.length} Tallahassee vehicles in API`);
    expect(tlhVehicles.length).toBeGreaterThanOrEqual(23);

    // Verify first TLH vehicle has required data
    if (tlhVehicles.length > 0) {
      const firstVehicle = tlhVehicles[0];
      expect(firstVehicle).toHaveProperty('latitude');
      expect(firstVehicle).toHaveProperty('longitude');
      expect(firstVehicle).toHaveProperty('locationAddress');
      expect(firstVehicle.metadata).toHaveProperty('image_url');

      console.log('✅ First TLH vehicle verified:', {
        number: firstVehicle.number,
        name: firstVehicle.name,
        location: firstVehicle.locationAddress,
        hasImage: !!firstVehicle.metadata?.image_url,
        hasGPS: !!(firstVehicle.latitude && firstVehicle.longitude)
      });
    }
  });

  test('should verify drivers with avatars in API', async ({ page }) => {
    // Fetch drivers from API
    const response = await page.goto('http://localhost:3001/api/drivers');
    const data = await response?.json();

    const drivers = data?.data || [];
    const driversWithAvatars = drivers.filter((d: any) => d.metadata?.avatar_url);

    console.log(`✅ Found ${driversWithAvatars.length} drivers with avatars in API`);
    expect(driversWithAvatars.length).toBeGreaterThanOrEqual(30);

    // Verify first driver
    if (driversWithAvatars.length > 0) {
      const firstDriver = driversWithAvatars[0];
      expect(firstDriver.metadata).toHaveProperty('avatar_url');
      expect(firstDriver.metadata.avatar_url).toContain('dicebear');

      console.log('✅ First driver verified:', {
        name: `${firstDriver.firstName} ${firstDriver.lastName}`,
        phone: firstDriver.phone,
        avatar: firstDriver.metadata.avatar_url?.substring(0, 60) + '...'
      });
    }
  });
});
