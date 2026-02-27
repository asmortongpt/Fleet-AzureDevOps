import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'http://localhost:5173';

test.describe('🔍 PAGE DIAGNOSTICS', () => {
  test('Dashboard Home', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const structure = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      buttons: document.querySelectorAll('button').length,
      links: document.querySelectorAll('a').length,
      images: document.querySelectorAll('img').length,
      imagesNoAlt: Array.from(document.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      focusable: document.querySelectorAll('button, a, input, [tabindex]').length,
      title: document.title,
    }));

    const a11y = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    console.log(`\n${'='.repeat(80)}\n📊 DASHBOARD HOME AUDIT\n${'='.repeat(80)}`);
    console.log(`Title: "${structure.title}"`);
    console.log(`Headings: H1(${structure.h1}) H2(${structure.h2})`);
    console.log(`Interactive: Buttons(${structure.buttons}) Links(${structure.links}) Focusable(${structure.focusable})`);
    console.log(`Navigation: ${structure.nav}`);
    console.log(`Images: ${structure.images} (${structure.imagesNoAlt} without alt)`);
    console.log(`A11y Violations: ${a11y.violations.length}`);

    if (a11y.violations.length > 0) {
      console.log(`\nAccessibility Issues:`);
      a11y.violations.slice(0, 3).forEach(v => {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
      });
    }
  });

  test('Fleet Management', async ({ page }) => {
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const structure = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      buttons: document.querySelectorAll('button').length,
      links: document.querySelectorAll('a').length,
      images: document.querySelectorAll('img').length,
      imagesNoAlt: Array.from(document.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      focusable: document.querySelectorAll('button, a, input, [tabindex]').length,
      title: document.title,
    }));

    const a11y = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    console.log(`\n${'='.repeat(80)}\n📊 FLEET MANAGEMENT AUDIT\n${'='.repeat(80)}`);
    console.log(`Title: "${structure.title}"`);
    console.log(`Headings: H1(${structure.h1}) H2(${structure.h2})`);
    console.log(`Interactive: Buttons(${structure.buttons}) Links(${structure.links}) Focusable(${structure.focusable})`);
    console.log(`Navigation: ${structure.nav}`);
    console.log(`Images: ${structure.images} (${structure.imagesNoAlt} without alt)`);
    console.log(`A11y Violations: ${a11y.violations.length}`);

    if (a11y.violations.length > 0) {
      console.log(`\nAccessibility Issues:`);
      a11y.violations.slice(0, 3).forEach(v => {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
      });
    }
  });

  test('Drivers Module', async ({ page }) => {
    await page.goto(`${BASE_URL}/drivers`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const structure = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      buttons: document.querySelectorAll('button').length,
      links: document.querySelectorAll('a').length,
      images: document.querySelectorAll('img').length,
      imagesNoAlt: Array.from(document.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      focusable: document.querySelectorAll('button, a, input, [tabindex]').length,
      title: document.title,
    }));

    const a11y = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    console.log(`\n${'='.repeat(80)}\n📊 DRIVERS MODULE AUDIT\n${'='.repeat(80)}`);
    console.log(`Title: "${structure.title}"`);
    console.log(`Headings: H1(${structure.h1}) H2(${structure.h2})`);
    console.log(`Interactive: Buttons(${structure.buttons}) Links(${structure.links}) Focusable(${structure.focusable})`);
    console.log(`Navigation: ${structure.nav}`);
    console.log(`Images: ${structure.images} (${structure.imagesNoAlt} without alt)`);
    console.log(`A11y Violations: ${a11y.violations.length}`);

    if (a11y.violations.length > 0) {
      console.log(`\nAccessibility Issues:`);
      a11y.violations.slice(0, 3).forEach(v => {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
      });
    }
  });

  test('Maintenance', async ({ page }) => {
    await page.goto(`${BASE_URL}/maintenance`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const structure = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      buttons: document.querySelectorAll('button').length,
      links: document.querySelectorAll('a').length,
      images: document.querySelectorAll('img').length,
      imagesNoAlt: Array.from(document.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      focusable: document.querySelectorAll('button, a, input, [tabindex]').length,
      title: document.title,
    }));

    const a11y = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    console.log(`\n${'='.repeat(80)}\n📊 MAINTENANCE AUDIT\n${'='.repeat(80)}`);
    console.log(`Title: "${structure.title}"`);
    console.log(`Headings: H1(${structure.h1}) H2(${structure.h2})`);
    console.log(`Interactive: Buttons(${structure.buttons}) Links(${structure.links}) Focusable(${structure.focusable})`);
    console.log(`Navigation: ${structure.nav}`);
    console.log(`Images: ${structure.images} (${structure.imagesNoAlt} without alt)`);
    console.log(`A11y Violations: ${a11y.violations.length}`);

    if (a11y.violations.length > 0) {
      console.log(`\nAccessibility Issues:`);
      a11y.violations.slice(0, 3).forEach(v => {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
      });
    }
  });
});
