import { test, expect } from '@playwright/test';

test('Deep Visual Diagnosis - Fleet Dashboard', async ({ page }) => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   FLEET DASHBOARD - DEEP VISUAL INSPECTION (MIT PhD Level)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Capture console logs
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    if (type === 'error' || type === 'warning') {
      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    }
  });

  // Capture network errors
  const networkErrors: Array<{ url: string; status: number }> = [];
  page.on('response', response => {
    if (!response.ok() && response.status() !== 304) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
      console.log(`[NETWORK ERROR] ${response.status()} - ${response.url()}`);
    }
  });

  console.log('1. Loading http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('   ✅ Page loaded\n');

  await page.waitForTimeout(3000);

  console.log('2. DOM STRUCTURE ANALYSIS:');
  const domAnalysis = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return { error: 'No root element' };

    const getStyles = (el: HTMLElement) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        width: styles.width,
        height: styles.height,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    };

    return {
      rootStyles: getStyles(root),
      rootChildren: root.children.length,
      bodyStyles: getStyles(document.body),
      theme: document.documentElement.classList.contains('dark') ? 'DARK' :
             document.documentElement.classList.contains('light') ? 'LIGHT' : 'UNKNOWN',
      visibleText: document.body.innerText.substring(0, 300)
    };
  });

  console.log('   Root Element:');
  console.log('     - Children:', domAnalysis.rootChildren);
  console.log('     - Display:', domAnalysis.rootStyles.display);
  console.log('     - Width:', domAnalysis.rootStyles.width);
  console.log('     - Height:', domAnalysis.rootStyles.height);
  console.log('     - Background:', domAnalysis.rootStyles.backgroundColor);
  console.log('   Theme:', domAnalysis.theme);
  console.log('   Visible Text Preview:', domAnalysis.visibleText.substring(0, 100));
  console.log('');

  console.log('3. COMPONENT DETECTION:');
  const components = await page.evaluate(() => {
    return {
      headers: document.querySelectorAll('h1, h2, h3').length,
      tables: document.querySelectorAll('table').length,
      tableRows: document.querySelectorAll('tr').length,
      buttons: document.querySelectorAll('button').length,
      navigation: document.querySelectorAll('nav, aside').length,
      main: document.querySelectorAll('main').length,
      loading: document.querySelectorAll('[data-loading], .loading, .spinner').length,
      errors: document.querySelectorAll('[role="alert"], .error').length
    };
  });

  console.log('   Headers:', components.headers);
  console.log('   Tables:', components.tables);
  console.log('   Table Rows:', components.tableRows);
  console.log('   Buttons:', components.buttons);
  console.log('   Navigation Elements:', components.navigation);
  console.log('   Main Content Areas:', components.main);
  console.log('   Loading Indicators:', components.loading);
  console.log('   Error Messages:', components.errors);
  console.log('');

  console.log('4. LAYOUT ANALYSIS:');
  const layout = await page.evaluate(() => {
    const main = document.querySelector('main');
    const sidebar = document.querySelector('aside');
    const header = document.querySelector('header, h1');

    const analyze = (el: Element | null, name: string) => {
      if (!el) return { name, exists: false };
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        name,
        exists: true,
        visible: rect.width > 0 && rect.height > 0,
        bounds: {
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        computed: {
          display: styles.display,
          position: styles.position,
          zIndex: styles.zIndex
        }
      };
    };

    return {
      main: analyze(main, 'Main Content'),
      sidebar: analyze(sidebar, 'Sidebar'),
      header: analyze(header, 'Header'),
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };
  });

  console.log('   Viewport:', layout.viewport.width, 'x', layout.viewport.height);
  console.log('   Main Content:', JSON.stringify(layout.main, null, 2));
  console.log('   Sidebar:', JSON.stringify(layout.sidebar, null, 2));
  console.log('   Header:', JSON.stringify(layout.header, null, 2));
  console.log('');

  console.log('5. DATA STATE:');
  const dataState = await page.evaluate(() => {
    return {
      apiResponses: (window as any).__FLEET_API_RESPONSES__ || {},
      localStorage: {
        demo_mode: localStorage.getItem('demo_mode'),
        debug_fleet_data: localStorage.getItem('debug_fleet_data')
      }
    };
  });

  console.log('   API Responses:', JSON.stringify(dataState.apiResponses, null, 2));
  console.log('   LocalStorage:', JSON.stringify(dataState.localStorage, null, 2));
  console.log('');

  console.log('6. CAPTURING SCREENSHOTS:');
  await page.screenshot({ path: '/tmp/fleet-full-page.png', fullPage: true });
  console.log('   ✅ Full page: /tmp/fleet-full-page.png');

  await page.screenshot({ path: '/tmp/fleet-viewport.png' });
  console.log('   ✅ Viewport: /tmp/fleet-viewport.png');
  console.log('');

  console.log('7. ERROR SUMMARY:');
  const errorCount = consoleLogs.filter(l => l.type === 'error').length;
  console.log(`   Console Errors: ${errorCount}`);
  console.log(`   Network Errors: ${networkErrors.length}`);

  if (errorCount > 0) {
    console.log('\n   Top Console Errors:');
    consoleLogs.filter(l => l.type === 'error').slice(0, 5).forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.text}`);
    });
  }

  if (networkErrors.length > 0) {
    console.log('\n   Network Errors:');
    networkErrors.slice(0, 5).forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.status}] ${err.url}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   DIAGNOSIS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Wait longer for visual inspection
  await page.waitForTimeout(5000);

  // Expect page to be functional
  expect(domAnalysis.rootChildren).toBeGreaterThan(0);
});
