import { test } from '@playwright/test';

test('detailed debugging of localhost:4175', async ({ page }) => {
  const allLogs: any[] = [];

  // Capture ALL console messages
  page.on('console', (msg) => {
    allLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Capture page errors with full details
  page.on('pageerror', (error) => {
    console.log('\n==== PAGE ERROR ====');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
    console.log('====================\n');
  });

  // Navigate
  console.log('Navigating to http://localhost:4175...');
  await page.goto('http://localhost:4175', { waitUntil: 'networkidle' });

  // Wait for any rendering
  await page.waitForTimeout(3000);

  // Get detailed page state
  const pageState = await page.evaluate(() => {
    return {
      documentReadyState: document.readyState,
      rootElement: {
        exists: !!document.getElementById('root'),
        innerHTML: document.getElementById('root')?.innerHTML || 'N/A',
        childrenCount: document.getElementById('root')?.children.length || 0,
        firstChildTagName: document.getElementById('root')?.children[0]?.tagName || 'N/A'
      },
      bodyChildren: document.body.children.length,
      scripts: Array.from(document.scripts).map(s => ({ src: s.src, type: s.type })),
      globalReact: typeof (window as any).React,
      globalReactDOM: typeof (window as any).ReactDOM,
      runtimeConfig: (window as any).__RUNTIME_CONFIG__ ? 'exists' : 'missing'
    };
  });

  console.log('\n==== PAGE STATE ====');
  console.log(JSON.stringify(pageState, null, 2));
  console.log('====================\n');

  console.log('\n==== ALL CONSOLE LOGS ====');
  allLogs.forEach((log, i) => {
    console.log(`${i + 1}. [${log.type}] ${log.text}`);
    if (log.location.url) {
      console.log(`   Location: ${log.location.url}:${log.location.lineNumber}`);
    }
  });
  console.log('==========================\n');

  // Take screenshot
  await page.screenshot({
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/test-screenshots/detailed-debug.png',
    fullPage: true
  });

  console.log('Screenshot saved to: /Users/andrewmorton/Documents/GitHub/Fleet/test-screenshots/detailed-debug.png');
});
