import { test } from '@playwright/test';

test('Find floating Vehicle Status element', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(5000);

  const floatingElement = await page.evaluate(() => {
    // Search for element containing "Vehicle Status"
    const allElements = Array.from(document.querySelectorAll('*'));
    const vehicleStatusElements = allElements.filter(el =>
      el.textContent?.includes('Vehicle Status') &&
      el.textContent?.includes('Active') &&
      el.textContent?.includes('Idle')
    );

    return vehicleStatusElements.map(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        position: styles.position,
        zIndex: styles.zIndex,
        top: styles.top,
        left: styles.left,
        right: styles.right,
        bottom: styles.bottom,
        textContent: el.textContent?.substring(0, 200),
      };
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log('FLOATING VEHICLE STATUS ELEMENT(S):');
  console.log('='.repeat(80));
  floatingElement.forEach((el, idx) => {
    console.log(`\nElement ${idx + 1}:`);
    console.log(JSON.stringify(el, null, 2));
  });
  console.log('\n' + '='.repeat(80));

  // Take screenshot highlighting the issue
  await page.screenshot({
    path: '/tmp/floating-element-issue.png',
    fullPage: false
  });
  console.log('\n📸 Screenshot: /tmp/floating-element-issue.png');
});
