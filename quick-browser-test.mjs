import playwright from 'playwright';

const candidates = [
  process.env.BASE_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean);

const resolveBaseUrl = async (page) => {
  for (const url of candidates) {
    try {
      await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });
      return url;
    } catch {
      // Try next candidate
    }
  }
  return null;
};

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();

  try {
    const baseUrl = await resolveBaseUrl(page);
    if (!baseUrl) {
      console.error('❌ Error: Unable to reach frontend on known ports.');
      return;
    }

    console.log(`\n🔍 Testing ${baseUrl}...\n`);

    await page.goto(baseUrl, { timeout: 30000 });
    await page.waitForTimeout(4000); // Wait for auth/session initialization

    const bodyText = await page.locator('body').textContent();
    console.log(`✅ Body text length: ${bodyText.length} characters`);
    console.log(`\n📄 First 300 characters:\n${bodyText.substring(0, 300)}\n`);

    const baseSlug = baseUrl.replace('http://', '').replace('https://', '').replace(/[:/]/g, '-');

    await page.screenshot({
      path: `test-results/manual-homepage-test-${baseSlug}.png`,
      fullPage: true
    });
    console.log(`✅ Screenshot saved to test-results/manual-homepage-test-${baseSlug}.png\n`);

    console.log(`🔍 Testing ${baseUrl}/fleet...\n`);
    await page.goto(`${baseUrl}/fleet`, { timeout: 30000 });
    await page.waitForTimeout(4000);

    const fleetText = await page.locator('body').textContent();
    console.log(`✅ Fleet Hub text length: ${fleetText.length} characters`);
    console.log(`\n📄 First 300 characters:\n${fleetText.substring(0, 300)}\n`);

    await page.screenshot({
      path: `test-results/manual-fleet-test-${baseSlug}.png`,
      fullPage: true
    });
    console.log(`✅ Screenshot saved to test-results/manual-fleet-test-${baseSlug}.png\n`);

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
