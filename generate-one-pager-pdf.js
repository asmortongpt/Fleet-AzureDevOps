/**
 * Generate One-Pager PDF
 */
import { chromium } from 'playwright';

async function convertToPDF() {
  console.log('🚀 Generating CTA Fleet One-Pager PDF...\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  const htmlPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/CTA-Fleet-One-Pager.html';
  const fileUrl = `file://${htmlPath}`;

  console.log(`📄 Loading: ${htmlPath}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  await page.waitForTimeout(2000);

  const pdfPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/CTA-Fleet-One-Pager.pdf';

  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });

  console.log(`\n✅ One-pager PDF created: ${pdfPath}`);
  console.log('✨ Ready to leave with customer!\n');

  await browser.close();
}

convertToPDF().catch(console.error);
