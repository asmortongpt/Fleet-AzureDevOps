import { test } from '@playwright/test';

test('Deep diagnosis', async ({ page }) => {
  const logs: any[] = [];
  const errors: any[] = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => errors.push({ message: err.message, stack: err.stack }));

  await page.goto('https://fleet.capitaltechalliance.com', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  await page.waitForTimeout(3000);

  const diagnostics = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootExists: !!root,
      rootHTML: root?.innerHTML || '',
      rootChildren: root?.childElementCount || 0,
      hasRuntimeConfig: typeof (window as any).__RUNTIME_CONFIG__ !== 'undefined',
      runtimeConfig: (window as any).__RUNTIME_CONFIG__,
      documentScripts: Array.from(document.scripts).map(s => s.src),
      documentTitle: document.title
    };
  });

  console.log('ROOT:', diagnostics.rootExists, 'Children:', diagnostics.rootChildren);
  console.log('Runtime config loaded:', diagnostics.hasRuntimeConfig);
  console.log('Config:', JSON.stringify(diagnostics.runtimeConfig, null, 2));
  console.log('Scripts:', diagnostics.documentScripts.length);
  diagnostics.documentScripts.forEach(s => console.log('  -', s));
  console.log('Console messages:', logs.length);
  logs.forEach(l => console.log('  [' + l.type + ']', l.text));
  console.log('PAGE ERRORS:', errors.length);
  errors.forEach(e => {
    console.log('  ERROR:', e.message);
    console.log('  STACK:', e.stack);
  });

  await page.screenshot({ path: 'test-results/deep-diagnosis.png', fullPage: true });
});
