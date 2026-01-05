import { chromium } from 'playwright';
import fs from 'fs';

async function extractUI() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    await page.goto('http://localhost:5174');
    await page.waitForTimeout(3000);

    // Click Operations Hub in sidebar
    try {
        await page.click('text="Operations Hub"', { timeout: 10000 });
        await page.waitForTimeout(3000);
    } catch (e) {
        console.log('Trying alternative navigation...');
    }

    // Extract the full HTML
    const html = await page.content();

    // Extract all computed styles
    const styles = await page.evaluate(() => {
        const styleSheets = Array.from(document.styleSheets);
        let css = '';
        styleSheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach(rule => {
                    css += rule.cssText + '\n';
                });
            } catch (e) {
                // Cross-origin sheets
            }
        });
        return css;
    });

    // Save extracted content
    fs.writeFileSync('./screenshots/extracted-page.html', html);
    fs.writeFileSync('./screenshots/extracted-styles.css', styles);

    console.log('✅ Extracted HTML and CSS from running app');
    console.log('📁 Files saved to screenshots/');

    await browser.close();
}

extractUI().catch(console.error);
