import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('NUCLEAR MODE - Evidence Collection', () => {
  test('Collect complete evidence at 1440x900', async ({ page }) => {
    const evidence: any = {
      timestamp: new Date().toISOString(),
      viewport: { width: 1440, height: 900 },
      consoleLogs: [],
      consoleErrors: [],
      consoleWarnings: [],
      networkErrors: [],
      domStructure: null,
      computedStyles: null,
      screenshots: {}
    };

    // Capture all console output
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      evidence.consoleLogs.push({ type, text, timestamp: Date.now() });

      if (type === 'error') {
        evidence.consoleErrors.push(text);
        console.log(`❌ CONSOLE ERROR: ${text}`);
      } else if (type === 'warning') {
        evidence.consoleWarnings.push(text);
        console.log(`⚠️  CONSOLE WARNING: ${text}`);
      }
    });

    // Capture network failures
    page.on('response', response => {
      if (!response.ok() && response.status() !== 304) {
        const error = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        };
        evidence.networkErrors.push(error);
        console.log(`🌐 NETWORK ERROR: ${error.status} ${error.url}`);
      }
    });

    // Set viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    console.log('\n═══════════════════════════════════════');
    console.log('   NUCLEAR EVIDENCE COLLECTION - 1440x900');
    console.log('═══════════════════════════════════════\n');

    // Navigate
    console.log('📍 Loading http://localhost:5173');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for React to render
    await page.waitForTimeout(3000);

    // Capture DOM structure
    console.log('\n📊 Capturing DOM structure...');
    evidence.domStructure = await page.evaluate(() => {
      const root = document.getElementById('root');

      return {
        hasRoot: !!root,
        rootInnerHTML_length: root?.innerHTML.length || 0,
        rootChildren: root?.children.length || 0,

        // Layout elements
        aside: {
          exists: !!document.querySelector('aside'),
          count: document.querySelectorAll('aside').length,
          visible: Array.from(document.querySelectorAll('aside')).some(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          })
        },

        nav: {
          exists: !!document.querySelector('nav'),
          count: document.querySelectorAll('nav').length
        },

        main: {
          exists: !!document.querySelector('main'),
          count: document.querySelectorAll('main').length
        },

        // Interactive elements
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        inputs: document.querySelectorAll('input').length,

        // Content
        headers: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        tables: document.querySelectorAll('table').length,

        // Body text preview
        bodyText: document.body.innerText.substring(0, 500),

        // Specific Fleet elements
        fleetDashboard: !!document.querySelector('[class*="fleet"]'),
        vehicleTable: !!document.querySelector('table'),

        // Layout container
        mainContainer: {
          exists: !!document.querySelector('.min-h-screen'),
          flexContainer: !!document.querySelector('.flex')
        }
      };
    });

    console.log('  ✅ DOM structure captured');
    console.log(`     - Root exists: ${evidence.domStructure.hasRoot}`);
    console.log(`     - Aside exists: ${evidence.domStructure.aside.exists}`);
    console.log(`     - Aside visible: ${evidence.domStructure.aside.visible}`);
    console.log(`     - Nav exists: ${evidence.domStructure.nav.exists}`);
    console.log(`     - Main exists: ${evidence.domStructure.main.exists}`);
    console.log(`     - Buttons: ${evidence.domStructure.buttons}`);

    // Capture computed styles for key elements
    console.log('\n🎨 Capturing computed styles...');
    evidence.computedStyles = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      const mainContainer = document.querySelector('.min-h-screen');

      const getStyles = (el: Element | null) => {
        if (!el) return null;
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        return {
          display: styles.display,
          position: styles.position,
          width: styles.width,
          height: styles.height,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          overflow: styles.overflow,
          backgroundColor: styles.backgroundColor,
          boundingBox: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        };
      };

      return {
        aside: getStyles(aside),
        mainContainer: getStyles(mainContainer)
      };
    });

    console.log('  ✅ Computed styles captured');
    if (evidence.computedStyles.aside) {
      console.log(`     - Aside width: ${evidence.computedStyles.aside.width}`);
      console.log(`     - Aside display: ${evidence.computedStyles.aside.display}`);
      console.log(`     - Aside visibility: ${evidence.computedStyles.aside.visibility}`);
      console.log(`     - Aside bounding box: ${JSON.stringify(evidence.computedStyles.aside.boundingBox)}`);
    } else {
      console.log('     ⚠️  No aside element found');
    }

    // Take screenshots
    console.log('\n📸 Capturing screenshots...');

    await page.screenshot({
      path: '/tmp/NUCLEAR_fullpage_1440x900.png',
      fullPage: true
    });
    evidence.screenshots.fullPage = '/tmp/NUCLEAR_fullpage_1440x900.png';
    console.log('  ✅ Full page: /tmp/NUCLEAR_fullpage_1440x900.png');

    await page.screenshot({
      path: '/tmp/NUCLEAR_viewport_1440x900.png',
      fullPage: false
    });
    evidence.screenshots.viewport = '/tmp/NUCLEAR_viewport_1440x900.png';
    console.log('  ✅ Viewport: /tmp/NUCLEAR_viewport_1440x900.png');

    // Summary
    console.log('\n📋 EVIDENCE SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Console Errors: ${evidence.consoleErrors.length}`);
    console.log(`Console Warnings: ${evidence.consoleWarnings.length}`);
    console.log(`Network Errors: ${evidence.networkErrors.length}`);
    console.log(`Aside Element: ${evidence.domStructure.aside.exists ? 'EXISTS' : 'MISSING'}`);
    console.log(`Aside Visible: ${evidence.domStructure.aside.visible ? 'YES' : 'NO'}`);
    console.log(`Nav Element: ${evidence.domStructure.nav.exists ? 'EXISTS' : 'MISSING'}`);

    if (evidence.consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS:');
      evidence.consoleErrors.slice(0, 5).forEach((err: string, i: number) => {
        console.log(`   ${i + 1}. ${err.substring(0, 100)}`);
      });
    }

    console.log('\n═══════════════════════════════════════\n');

    // Save evidence to file
    fs.writeFileSync(
      '/tmp/NUCLEAR_evidence_1440x900.json',
      JSON.stringify(evidence, null, 2)
    );
    console.log('💾 Evidence saved: /tmp/NUCLEAR_evidence_1440x900.json');

    // Allow test to pass - we're just collecting evidence
    expect(evidence.domStructure.hasRoot).toBe(true);
  });

  test('Collect evidence at mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    console.log('\n📱 MOBILE EVIDENCE - 390x844\n');

    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/NUCLEAR_mobile_390x844.png',
      fullPage: true
    });

    console.log('  ✅ Mobile screenshot: /tmp/NUCLEAR_mobile_390x844.png\n');
  });
});
