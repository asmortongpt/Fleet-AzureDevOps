import { test } from '@playwright/test';

test('Check aside classes and computed width', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  const asideInfo = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return { exists: false };

    return {
      exists: true,
      className: aside.className,
      classList: Array.from(aside.classList),
      hasW64: aside.classList.contains('w-64'),
      hasW0: aside.classList.contains('w-0'),
      style: aside.getAttribute('style'),
      computedWidth: window.getComputedStyle(aside).width,
      computedDisplay: window.getComputedStyle(aside).display
    };
  });

  console.log('\n═══ ASIDE CLASS ANALYSIS ═══');
  console.log(JSON.stringify(asideInfo, null, 2));
  console.log('═══════════════════════════\n');
});
