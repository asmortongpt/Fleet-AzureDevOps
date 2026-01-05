/**
 * Generate Presentation Slide PDFs
 */
import { chromium } from 'playwright';

async function convertToPDF() {
  console.log('🚀 Generating FleetOps Presentation PDFs...\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Convert Additional Hubs slide
  const hubsHtmlPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/FleetOps-Additional-Hubs.html';
  const hubsPdfPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/FleetOps-Additional-Hubs.pdf';

  console.log(`📄 Loading: ${hubsHtmlPath}`);
  await page.goto(`file://${hubsHtmlPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.pdf({
    path: hubsPdfPath,
    width: '1920px',
    height: '1080px',
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

  console.log(`✅ Additional Hubs PDF created: ${hubsPdfPath}\n`);

  // Convert Benefits slide
  const benefitsHtmlPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/FleetOps-Benefits.html';
  const benefitsPdfPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/FleetOps-Benefits.pdf';

  console.log(`📄 Loading: ${benefitsHtmlPath}`);
  await page.goto(`file://${benefitsHtmlPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.pdf({
    path: benefitsPdfPath,
    width: '1920px',
    height: '1080px',
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

  console.log(`✅ Benefits PDF created: ${benefitsPdfPath}\n`);

  // Convert Full Features slide
  const fullFeaturesHtmlPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/FleetOps-Full-Features.html';
  const fullFeaturesPdfPath = '/Users/andrewmorton/Desktop/Fleet-Demo-Guide/FleetOps-Full-Features.pdf';

  console.log(`📄 Loading: ${fullFeaturesHtmlPath}`);
  await page.goto(`file://${fullFeaturesHtmlPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.pdf({
    path: fullFeaturesPdfPath,
    width: '1920px',
    height: '1080px',
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

  console.log(`✅ Full Features PDF created: ${fullFeaturesPdfPath}\n`);
  console.log('✨ All three presentation slides ready for Monday demo!\n');

  await browser.close();
}

convertToPDF().catch(console.error);
