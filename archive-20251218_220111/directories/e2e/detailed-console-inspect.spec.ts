import { test, expect } from '@playwright/test';

test('Detailed console and error inspection', async ({ page }) => {
  const consoleMessages: any[] = [];
  const errors: any[] = [];

  // Capture ALL console messages
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    errors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // Navigate
  console.log('🔍 Navigating to http://localhost:4173/');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // Wait for potential React mount
  await page.waitForTimeout(3000);

  // Inspect page state
  console.log('\n📊 PAGE STATE:');

  const html = await page.content();
  console.log('HTML length:', html.length);

  const rootHTML = await page.locator('#root').innerHTML();
  console.log('Root innerHTML length:', rootHTML.length);
  console.log('Root HTML:', rootHTML.substring(0, 200));

  // Check all loaded scripts
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(s => ({
      src: s.src,
      type: s.type,
      loaded: !!s.src
    }));
  });
  console.log('\n📜 LOADED SCRIPTS:', scripts.length);
  scripts.forEach(s => console.log(`  - ${s.src || '(inline)'} [${s.type}]`));

  // Check CSS
  const styles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => ({
      href: (l as HTMLLinkElement).href
    }));
  });
  console.log('\n🎨 LOADED STYLESHEETS:', styles.length);
  styles.forEach(s => console.log(`  - ${s.href}`));

  // Check if React exists
  const reactInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      reactExists: typeof (window as any).React !== 'undefined',
      reactDOMExists: typeof (window as any).ReactDOM !== 'undefined',
      rootExists: !!root,
      rootChildren: root?.children.length || 0,
      rootHTML: root?.innerHTML || '',
      bodyChildren: document.body.children.length
    };
  });
  console.log('\n⚛️  REACT INFO:', JSON.stringify(reactInfo, null, 2));

  // Log all console messages
  console.log('\n💬 CONSOLE MESSAGES:', consoleMessages.length);
  consoleMessages.forEach(msg => {
    console.log(`  [${msg.type}] ${msg.text}`);
    if (msg.location) {
      console.log(`    at ${msg.location.url}:${msg.location.lineNumber}`);
    }
  });

  // Log all errors
  console.log('\n❌ PAGE ERRORS:', errors.length);
  errors.forEach(err => {
    console.log(`  ${err.message}`);
    if (err.stack) {
      console.log(`  Stack: ${err.stack.substring(0, 200)}`);
    }
  });

  // Take full page screenshot
  await page.screenshot({ path: 'test-results/detailed-inspection.png', fullPage: true });

  console.log('\n📸 Screenshot saved to test-results/detailed-inspection.png');
});
