import { chromium } from 'playwright';
import fs from 'fs';

async function cloneUI() {
    console.log('🚀 Cloning UI from running application...\n');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const hubs = [
        { name: 'Operations Hub', file: 'operations-hub' },
        { name: 'Assets Hub', file: 'assets-hub' },
        { name: 'Maintenance Hub', file: 'maintenance-hub' },
        { name: 'Compliance Hub', file: 'compliance-hub' },
    ];

    for (const hub of hubs) {
        console.log(`📋 Cloning ${hub.name}...`);

        try {
            // Navigate to hub
            await page.click(`text="${hub.name}"`, { timeout: 5000 });
            await page.waitForTimeout(2500);

            // Extract complete HTML with computed styles
            const clonedHTML = await page.evaluate(() => {
                // Get all stylesheets content
                let allCSS = '';
                const styleSheets = Array.from(document.styleSheets);

                styleSheets.forEach(sheet => {
                    try {
                        const rules = Array.from(sheet.cssRules || []);
                        rules.forEach(rule => {
                            allCSS += rule.cssText + '\n';
                        });
                    } catch (e) {
                        // Skip cross-origin sheets
                    }
                });

                // Get the main content (skip nav/sidebars if present)
                const mainContent = document.querySelector('[data-testid="hub-page"]') || document.body;
                const clonedContent = mainContent.cloneNode(true);

                // Create complete HTML document
                return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.0.3/src/regular/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.0.3/src/bold/style.css">
    <style>
${allCSS}

/* Ensure proper layout */
body {
    margin: 0;
    padding: 0;
}

/* Remove any React-specific artifacts */
#root {
    display: contents;
}
    </style>
</head>
<body>
    ${clonedContent.outerHTML}

    <script>
        // Make tabs work if present
        document.addEventListener('DOMContentLoaded', function() {
            const tabTriggers = document.querySelectorAll('[role="tab"]');
            tabTriggers.forEach(trigger => {
                trigger.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-value') || this.getAttribute('aria-controls');
                    if (!tabId) return;

                    // Update triggers
                    tabTriggers.forEach(t => {
                        t.setAttribute('data-state', 'inactive');
                        t.setAttribute('aria-selected', 'false');
                    });
                    this.setAttribute('data-state', 'active');
                    this.setAttribute('aria-selected', 'true');

                    // Update content
                    const allContent = document.querySelectorAll('[role="tabpanel"]');
                    allContent.forEach(content => {
                        content.style.display = 'none';
                        content.setAttribute('data-state', 'inactive');
                    });

                    const activeContent = document.querySelector(\`[data-value="\${tabId}"]\`) ||
                                         document.getElementById(tabId);
                    if (activeContent) {
                        activeContent.style.display = 'block';
                        activeContent.setAttribute('data-state', 'active');
                    }
                });
            });
        });
    </script>
</body>
</html>`;
            });

            // Save to file
            fs.writeFileSync(`./screenshots/${hub.file}.html`, clonedHTML);
            console.log(`   ✅ Saved ${hub.file}.html\n`);

        } catch (error) {
            console.log(`   ❌ Error cloning ${hub.name}: ${error.message}\n`);
        }
    }

    console.log('✨ UI cloning complete!');
    console.log('📁 HTML files saved to: ./screenshots/\n');

    await browser.close();
}

cloneUI();
