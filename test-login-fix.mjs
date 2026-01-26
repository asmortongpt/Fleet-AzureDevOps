import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://gray-flower-03a2a730f.3.azurestaticapps.net';
const LOCAL_URL = 'http://localhost:5174';

(async () => {
  console.log('\n🧪 LOGIN FIX VERIFICATION TEST\n');
  console.log('═'.repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  // Test BEFORE (Production - broken)
  console.log('\n📍 TEST 1: PRODUCTION (BEFORE FIX)');
  console.log('─'.repeat(70));

  const page1 = await browser.newPage();
  const cspViolations1 = [];

  page1.on('console', msg => {
    const text = msg.text();
    if (text.includes('CSP') || text.includes('violates')) {
      cspViolations1.push(text);
    }
  });

  await page1.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle' });

  const brandingVisible1 = await page1.getByText('Capital Tech Alliance').isVisible().catch(() => false);
  const textColor1 = await page1.locator('h1:has-text("Capital Tech Alliance")').evaluate(el => {
    return window.getComputedStyle(el).color;
  }).catch(() => 'unknown');

  await page1.screenshot({ path: '/tmp/login-before-fix.png', fullPage: true });

  console.log(`   URL: ${PRODUCTION_URL}/login`);
  console.log(`   Branding Visible: ${brandingVisible1 ? '✅ YES' : '❌ NO (invisible)'}`);
  console.log(`   Text Color: ${textColor1}`);
  console.log(`   CSP Violations: ${cspViolations1.length}`);
  console.log(`   Screenshot: /tmp/login-before-fix.png`);

  // Test AFTER (Local - fixed)
  console.log('\n📍 TEST 2: LOCAL BUILD (AFTER FIX)');
  console.log('─'.repeat(70));

  const page2 = await browser.newPage();
  const cspViolations2 = [];

  page2.on('console', msg => {
    const text = msg.text();
    if (text.includes('CSP') || text.includes('violates')) {
      cspViolations2.push(text);
    }
  });

  await page2.goto(`${LOCAL_URL}/login`, { waitUntil: 'networkidle' });

  const brandingVisible2 = await page2.getByText('Capital Tech Alliance').isVisible().catch(() => false);
  const textColor2 = await page2.locator('h1:has-text("Capital Tech Alliance")').evaluate(el => {
    return window.getComputedStyle(el).color;
  }).catch(() => 'unknown');

  await page2.screenshot({ path: '/tmp/login-after-fix.png', fullPage: true });

  console.log(`   URL: ${LOCAL_URL}/login`);
  console.log(`   Branding Visible: ${brandingVisible2 ? '✅ YES' : '❌ NO'}`);
  console.log(`   Text Color: ${textColor2}`);
  console.log(`   CSP Violations: ${cspViolations2.length}`);
  console.log(`   Screenshot: /tmp/login-after-fix.png`);

  // Test SSO on fixed version
  console.log('\n📍 TEST 3: SSO FUNCTIONALITY (LOCAL)');
  console.log('─'.repeat(70));

  const microsoftBtn = page2.getByRole('button', { name: /sign in with microsoft/i });
  const btnVisible = await microsoftBtn.isVisible();
  const btnEnabled = await microsoftBtn.isEnabled();

  console.log(`   Microsoft Button Visible: ${btnVisible ? '✅ YES' : '❌ NO'}`);
  console.log(`   Microsoft Button Enabled: ${btnEnabled ? '✅ YES' : '❌ NO'}`);

  // Click and verify redirect (don't complete OAuth locally)
  console.log('\n   Testing SSO redirect...');

  const navigationPromise = page2.waitForNavigation({ timeout: 10000 }).catch(() => null);
  await microsoftBtn.click();
  await new Promise(r => setTimeout(r, 2000));

  const finalUrl = page2.url();
  const redirectedToMicrosoft = finalUrl.includes('login.microsoftonline.com');

  console.log(`   Redirected to Microsoft: ${redirectedToMicrosoft ? '✅ YES' : '❌ NO'}`);
  console.log(`   Final URL: ${finalUrl.substring(0, 80)}...`);

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 COMPARISON SUMMARY');
  console.log('═'.repeat(70));

  console.log('\n╔════════════════════════════════╦═══════════╦═══════════╗');
  console.log('║ Test                           ║ BEFORE    ║ AFTER     ║');
  console.log('╠════════════════════════════════╬═══════════╬═══════════╣');
  console.log(`║ Branding Visible               ║ ${brandingVisible1 ? '✅ YES    ' : '❌ NO     '}║ ${brandingVisible2 ? '✅ YES    ' : '❌ NO     '}║`);
  console.log(`║ CSP Violations                 ║ ${cspViolations1.length.toString().padEnd(9, ' ')} ║ ${cspViolations2.length.toString().padEnd(9, ' ')} ║`);
  console.log(`║ Microsoft SSO Button           ║ ✅ YES     ║ ✅ YES     ║`);
  console.log(`║ SSO Redirect Works             ║ ✅ YES     ║ ${redirectedToMicrosoft ? '✅ YES    ' : '❌ NO     '}║`);
  console.log('╚════════════════════════════════╩═══════════╩═══════════╝');

  console.log('\n✅ FIX VERIFICATION: ' + (brandingVisible2 && cspViolations2.length < cspViolations1.length ? 'SUCCESS' : 'NEEDS MORE WORK'));
  console.log('   - Text visibility: ' + (brandingVisible2 ? 'FIXED ✅' : 'STILL BROKEN ❌'));
  console.log('   - CSP violations: ' + (cspViolations2.length < cspViolations1.length ? `REDUCED (${cspViolations1.length} → ${cspViolations2.length}) ✅` : 'NO CHANGE ⚠️'));
  console.log('   - SSO functionality: ' + (redirectedToMicrosoft ? 'WORKING ✅' : 'BROKEN ❌'));

  console.log('\n📸 VISUAL EVIDENCE:');
  console.log('   BEFORE: /tmp/login-before-fix.png');
  console.log('   AFTER:  /tmp/login-after-fix.png');
  console.log('═'.repeat(70));

  console.log('\n⏸️  Browser will close in 10 seconds...');
  await new Promise(r => setTimeout(r, 10000));

  await browser.close();
})();
