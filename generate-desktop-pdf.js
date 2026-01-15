/**
 * Generate PDF on Desktop with full styling
 */
import { chromium } from 'playwright';

async function convertToPDF() {
  console.log('🚀 Generating professional PDF on Desktop...\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Load the HTML file from desktop
  const htmlPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/COMPREHENSIVE-DEMO-WALKTHROUGH.html';
  const fileUrl = `file://${htmlPath}`;

  console.log(`📄 Loading: ${htmlPath}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Wait for content and images to fully render
  await page.waitForTimeout(3000);

  // Generate PDF
  const pdfPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/COMPREHENSIVE-DEMO-WALKTHROUGH.pdf';

  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: false,
    displayHeaderFooter: false,
    margin: {
      top: '0.4in',
      right: '0.4in',
      bottom: '0.4in',
      left: '0.4in',
    },
    scale: 0.95,
  });

  console.log(`\n✅ PDF created: ${pdfPath}`);
  console.log('✨ Professional PDF with full styling saved to Desktop!\n');

  await browser.close();
}

convertToPDF().catch(console.error);
