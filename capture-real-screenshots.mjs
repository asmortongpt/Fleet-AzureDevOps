import { chromium } from 'playwright';
import path from 'path';

async function captureScreenshots() {
    console.log('🚀 Capturing screenshots from REAL running application...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    try {
        // Navigate to app
        console.log('📱 Loading application...');
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);

        const hubs = [
            { name: 'Operations Hub', file: 'operations-hub' },
            { name: 'Assets Hub', file: 'assets-hub' },
            { name: 'Maintenance Hub', file: 'maintenance-hub' },
            { name: 'Compliance Hub', file: 'compliance-hub' },
        ];

        for (const hub of hubs) {
            console.log(`\n📸 Capturing ${hub.name}...`);

            // Try to click the hub in the navigation
            try {
                // Wait for and click the hub link
                await page.click(`text="${hub.name}"`, { timeout: 5000 });
                console.log(`   ✓ Navigated to ${hub.name}`);
                await page.waitForTimeout(2500);

                // Take screenshot
                await page.screenshot({
                    path: `./screenshots/${hub.file}.png`,
                    fullPage: true,
                });
                console.log(`   ✅ Saved ${hub.file}.png`);

            } catch (error) {
                console.log(`   ⚠️  Could not capture ${hub.name}: ${error.message}`);
            }
        }

        console.log('\n✨ Screenshot capture complete!');
        console.log('📁 Screenshots saved to: ./screenshots/\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

captureScreenshots();
