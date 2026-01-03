/**
 * Convert HTML Demo Guide to PDF
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertToPDF() {
  console.log('🚀 Converting HTML to PDF...\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Load the HTML file
  const htmlPath = join(__dirname, 'docs/presentations/COMPREHENSIVE-DEMO-WALKTHROUGH.html');
  const fileUrl = `file://${htmlPath}`;

  console.log(`📄 Loading: ${htmlPath}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Wait for content to fully render
  await page.waitForTimeout(2000);

  // Generate PDF
  const pdfPath = join(__dirname, 'docs/presentations/COMPREHENSIVE-DEMO-WALKTHROUGH.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in',
    },
  });

  console.log(`\n✅ PDF created: ${pdfPath}`);
  console.log('✨ Conversion complete!\n');

  await browser.close();
}

convertToPDF().catch(console.error);
