import { test } from '@playwright/test';

test('Search for error text in DOM', async ({ page }) => {
  console.log('\n=== SEARCHING FOR ERROR TEXT IN DOM ===\n');

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const analysis = await page.evaluate(() => {
    const allText = document.body.innerText || '';

    // Search for error-related keywords
    const errorKeywords = [
      'error', 'Error', 'ERROR',
      'failed', 'Failed', 'FAILED',
      'warning', 'Warning', 'WARNING',
      '404', '500', '502', '503',
      'not found', 'Not Found',
      'something went wrong',
      'crashed', 'Crashed'
    ];

    const foundIssues: any[] = [];

    errorKeywords.forEach(keyword => {
      if (allText.toLowerCase().includes(keyword.toLowerCase())) {
        // Find context around the keyword
        const lowerText = allText.toLowerCase();
        const index = lowerText.indexOf(keyword.toLowerCase());
        const start = Math.max(0, index - 100);
        const end = Math.min(allText.length, index + 100);
        const context = allText.substring(start, end);

        foundIssues.push({
          keyword,
          context: context.replace(/\n/g, ' ').trim()
        });
      }
    });

    // Check for visible error elements
    const errorElements = document.querySelectorAll(
      '[class*="error"], [class*="Error"], [role="alert"], .alert-danger, .error-message'
    );

    const visibleErrors: string[] = [];
    errorElements.forEach(el => {
      if (el instanceof HTMLElement && el.offsetParent !== null) {
        visibleErrors.push(el.textContent?.substring(0, 200) || '');
      }
    });

    // Get all visible text blocks
    const textBlocks: string[] = [];
    document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6').forEach(el => {
      if (el instanceof HTMLElement && el.offsetParent !== null) {
        const text = el.textContent?.trim();
        if (text && text.length > 20 && text.length < 500) {
          textBlocks.push(text);
        }
      }
    });

    return {
      foundIssues,
      visibleErrors,
      fullBodyText: allText,
      textBlocksSample: textBlocks.slice(0, 50)
    };
  });

  console.log('\n📋 FOUND ISSUES:');
  if (analysis.foundIssues.length > 0) {
    analysis.foundIssues.forEach((issue: any, i: number) => {
      console.log(`\n${i + 1}. Keyword: "${issue.keyword}"`);
      console.log(`   Context: ${issue.context}`);
    });
  } else {
    console.log('  No error-related keywords found');
  }

  console.log('\n🚨 VISIBLE ERROR ELEMENTS:');
  if (analysis.visibleErrors.length > 0) {
    analysis.visibleErrors.forEach((error: string, i: number) => {
      console.log(`\n${i + 1}. ${error}`);
    });
  } else {
    console.log('  No visible error elements found');
  }

  console.log('\n📄 SAMPLE TEXT BLOCKS (first 20):');
  analysis.textBlocksSample.slice(0, 20).forEach((block: string, i: number) => {
    console.log(`\n${i + 1}. ${block.substring(0, 150)}`);
  });

  console.log('\n=== END SEARCH ===\n');
});
