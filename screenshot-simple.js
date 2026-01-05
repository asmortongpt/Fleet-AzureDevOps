/**
 * Simple Screenshot Capture - Direct Hub Pages
 * Captures screenshots of hub pages exactly as they appear in the UI
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('🚀 Starting screenshot capture...\n');

    // Ensure screenshots directory exists
    const dir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: false,
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    try {
        console.log('📱 Navigating to application...\n');
        await page.goto('http://localhost:5174', { timeout: 30000 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Operations Hub
        console.log('📸 Capturing Operations Hub...');
        await page.evaluate(() => {
            const navContext = window;
            if (navContext.setActiveModule) {
                navContext.setActiveModule('operations-hub-consolidated');
            }
        });
        await page.waitForTimeout(2000);

        await page.screenshot({
            path: path.join(dir, 'operations-hub.png'),
            fullPage: true,
        });
        console.log('   ✅ Saved operations-hub.png\n');

        // Assets Hub
        console.log('📸 Capturing Assets Hub...');
        await page.evaluate(() => {
            const navContext = window;
            if (navContext.setActiveModule) {
                navContext.setActiveModule('assets-hub-consolidated');
            }
        });
        await page.waitForTimeout(2000);

        await page.screenshot({
            path: path.join(dir, 'assets-hub.png'),
            fullPage: true,
        });
        console.log('   ✅ Saved assets-hub.png\n');

        // Maintenance Hub
        console.log('📸 Capturing Maintenance Hub...');
        await page.evaluate(() => {
            const navContext = window;
            if (navContext.setActiveModule) {
                navContext.setActiveModule('maintenance-hub-consolidated');
            }
        });
        await page.waitForTimeout(2000);

        await page.screenshot({
            path: path.join(dir, 'maintenance-hub.png'),
            fullPage: true,
        });
        console.log('   ✅ Saved maintenance-hub.png\n');

        // Compliance Hub
        console.log('📸 Capturing Compliance Hub...');
        await page.evaluate(() => {
            const navContext = window;
            if (navContext.setActiveModule) {
                navContext.setActiveModule('compliance-hub-consolidated');
            }
        });
        await page.waitForTimeout(2000);

        await page.screenshot({
            path: path.join(dir, 'compliance-hub.png'),
            fullPage: true,
        });
        console.log('   ✅ Saved compliance-hub.png\n');

        console.log('✨ Screenshot capture complete!');
        console.log(`📁 Screenshots saved to: ${dir}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

main();
