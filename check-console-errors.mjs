import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console messages
  const errors = [];
  const warnings = [];
  const logs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    } else if (msg.type() === 'warning') {
      warnings.push(text);
    } else {
      logs.push(text);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });
  
  console.log('Loading http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  console.log('\n=== CONSOLE ERRORS ===');
  errors.forEach(e => console.log('❌', e));
  
  console.log('\n=== CONSOLE WARNINGS ===');
  warnings.forEach(w => console.log('⚠️ ', w));
  
  console.log('\n=== DOM STATE ===');
  const rootHTML = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      exists: !!root,
      innerHTML: root?.innerHTML || 'ROOT NOT FOUND',
      childCount: root?.children.length || 0
    };
  });
  console.log(JSON.stringify(rootHTML, null, 2));
  
  await page.waitForTimeout(5000);
  await browser.close();
})();
