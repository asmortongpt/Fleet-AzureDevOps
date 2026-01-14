import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();

  console.log('\n🔍 Testing http://localhost:5173...\n');

  try {
    await page.goto('http://localhost:5173', { timeout: 30000 });
    await page.waitForTimeout(4000); // Wait for auth bypass

    // Get body content
    const bodyText = await page.locator('body').textContent();
    console.log(`✅ Body text length: ${bodyText.length} characters`);
    console.log(`\n📄 First 300 characters:\n${bodyText.substring(0, 300)}\n`);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/manual-homepage-test.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved to test-results/manual-homepage-test.png\n');

    // Test Fleet Hub
    console.log('🔍 Testing http://localhost:5173/fleet...\n');
    await page.goto('http://localhost:5173/fleet', { timeout: 30000 });
    await page.waitForTimeout(4000);

    const fleetText = await page.locator('body').textContent();
    console.log(`✅ Fleet Hub text length: ${fleetText.length} characters`);
    console.log(`\n📄 First 300 characters:\n${fleetText.substring(0, 300)}\n`);

    await page.screenshot({
      path: 'test-results/manual-fleet-test.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved to test-results/manual-fleet-test.png\n');

    if (bodyText.length > 200 && fleetText.length > 200) {
      console.log('✅✅✅ SUCCESS! Pages are showing actual content!\n');
    } else {
      console.log('⚠️  WARNING: Pages may still be blank\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
