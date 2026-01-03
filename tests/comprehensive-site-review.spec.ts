import { test } from '@playwright/test';

test.describe('Fleet Management - Comprehensive Site Review', () => {
  const baseUrl = 'https://fleet.capitaltechalliance.com';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
  });

  test('Visual Appeal & Layout - No scroll needed', async ({ page }) => {
    // Check viewport fits content without scrolling
    const viewportHeight = page.viewportSize()?.height || 0;
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);

    console.log('Viewport height:', viewportHeight);
    console.log('Scroll height:', scrollHeight);
    console.log('Client height:', clientHeight);
    console.log('Needs scroll:', scrollHeight > clientHeight);

    // Take full page screenshot
    await page.screenshot({
      path: '/tmp/fleet-review-fullpage.png',
      fullPage: true
    });

    // Check if scrolling is needed
    const needsScroll = scrollHeight > clientHeight + 10; // 10px tolerance
    if (needsScroll) {
      console.warn(`⚠️  Page requires scrolling: ${scrollHeight}px > ${clientHeight}px`);
    }
  });

  test('WCAG 2.1 AA Compliance - Color Contrast', async ({ page }) => {
    // Check text color contrast ratios
    const contrastIssues = await page.evaluate(() => {
      const issues: any[] = [];

      // Get all text elements
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, a, label');

      textElements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;
        const fontSize = parseFloat(styles.fontSize);

        // Store for manual review
        if (color && bgColor) {
          issues.push({
            tag: el.tagName,
            text: el.textContent?.substring(0, 50),
            color,
            bgColor,
            fontSize
          });
        }
      });

      return issues;
    });

    console.log('Text elements for contrast review:', contrastIssues.length);
    console.log('Sample:', contrastIssues.slice(0, 5));
  });

  test('WCAG 2.1 AA - Keyboard Navigation', async ({ page }) => {
    // Test tab navigation through interactive elements
    const interactiveElements = await page.locator('button, a, input, select, textarea').all();
    console.log('Interactive elements found:', interactiveElements.length);

    // Tab through first 10 elements
    for (let i = 0; i < Math.min(10, interactiveElements.length); i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      console.log(`Tab ${i + 1}: ${focused}`);
    }
  });

  test('WCAG 2.1 AA - ARIA Labels & Semantic HTML', async ({ page }) => {
    const ariaIssues = await page.evaluate(() => {
      const issues: string[] = [];

      // Check buttons have accessible names
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn, idx) => {
        const hasText = btn.textContent?.trim();
        const hasAriaLabel = btn.getAttribute('aria-label');
        const hasAriaLabelledBy = btn.getAttribute('aria-labelledby');

        if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
          issues.push(`Button ${idx} has no accessible name`);
        }
      });

      // Check images have alt text
      const images = document.querySelectorAll('img');
      images.forEach((img, idx) => {
        if (!img.getAttribute('alt')) {
          issues.push(`Image ${idx} missing alt text: ${img.src}`);
        }
      });

      // Check form inputs have labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input, idx) => {
        const hasLabel = input.getAttribute('aria-label') ||
                        input.getAttribute('aria-labelledby') ||
                        document.querySelector(`label[for="${input.id}"]`);

        if (!hasLabel && input.getAttribute('type') !== 'hidden') {
          issues.push(`Form field ${idx} missing label`);
        }
      });

      // Check heading hierarchy
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let lastLevel = 0;
      headings.forEach((h) => {
        const level = parseInt(h.tagName[1]);
        if (level > lastLevel + 1) {
          issues.push(`Heading skip: ${lastLevel} → ${level}`);
        }
        lastLevel = level;
      });

      return issues;
    });

    console.log('ARIA/Accessibility Issues:', ariaIssues);
    ariaIssues.forEach(issue => console.warn(`⚠️  ${issue}`));
  });

  test('Responsive Design - Mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/tmp/fleet-mobile-375.png',
      fullPage: true
    });

    // Check for horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      console.warn('⚠️  Mobile view has horizontal scroll');
    }

    // Check text is readable
    const tinyText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const tinyElements: any[] = [];

      elements.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize < 12 && el.textContent?.trim()) {
          tinyElements.push({
            tag: el.tagName,
            fontSize,
            text: el.textContent.substring(0, 30)
          });
        }
      });

      return tinyElements;
    });

    if (tinyText.length > 0) {
      console.warn('⚠️  Text smaller than 12px found:', tinyText.length);
    }
  });

  test('Responsive Design - Tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/tmp/fleet-tablet-768.png',
      fullPage: true
    });
  });

  test('Responsive Design - Desktop (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/tmp/fleet-desktop-1920.png',
      fullPage: true
    });
  });

  test('Performance - Load Time & Resource Sizes', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(baseUrl, { waitUntil: 'load' });
    const loadTime = Date.now() - startTime;

    console.log('Page load time:', loadTime, 'ms');

    // Get resource sizes
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries.map(e => ({
        name: e.name.split('/').pop(),
        type: e.initiatorType,
        size: e.transferSize,
        duration: e.duration
      })).filter(r => r.size > 0);
    });

    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    console.log('Total resource size:', (totalSize / 1024).toFixed(2), 'KB');
    console.log('Large resources:', resources.filter(r => r.size > 100000).slice(0, 5));
  });

  test('Visual Elements - Colors, Typography, Spacing', async ({ page }) => {
    const visualAnalysis = await page.evaluate(() => {
      const analysis: any = {
        colors: new Set<string>(),
        fontFamilies: new Set<string>(),
        fontSizes: new Set<string>(),
        spacing: [] as any[]
      };

      // Analyze all visible elements
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);

        // Colors
        if (styles.color) analysis.colors.add(styles.color);
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          analysis.colors.add(styles.backgroundColor);
        }

        // Typography
        if (styles.fontFamily) analysis.fontFamilies.add(styles.fontFamily);
        if (styles.fontSize) analysis.fontSizes.add(styles.fontSize);
      });

      return {
        uniqueColors: Array.from(analysis.colors).length,
        colorSample: Array.from(analysis.colors).slice(0, 10),
        fontFamilies: Array.from(analysis.fontFamilies),
        fontSizes: Array.from(analysis.fontSizes).sort()
      };
    });

    console.log('Visual Analysis:');
    console.log('- Unique colors:', visualAnalysis.uniqueColors);
    console.log('- Font families:', visualAnalysis.fontFamilies);
    console.log('- Font sizes:', visualAnalysis.fontSizes);
  });

  test('Interactive Elements - Touch Targets (44x44px minimum)', async ({ page }) => {
    const smallTargets = await page.evaluate(() => {
      const interactive = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
      const small: any[] = [];

      interactive.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          small.push({
            tag: el.tagName,
            text: el.textContent?.substring(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });

      return small;
    });

    if (smallTargets.length > 0) {
      console.warn('⚠️  Touch targets smaller than 44x44px:', smallTargets.length);
      smallTargets.forEach(t => {
        console.warn(`   ${t.tag}: ${t.width}x${t.height}px - "${t.text}"`);
      });
    }
  });

  test('Content Review - Text Quality & Readability', async ({ page }) => {
    const contentAnalysis = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => ({ level: h.tagName, text: h.textContent?.trim() }));

      const paragraphs = Array.from(document.querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 0);

      const links = Array.from(document.querySelectorAll('a'))
        .map(a => ({
          text: a.textContent?.trim(),
          href: a.getAttribute('href'),
          hasHref: !!a.getAttribute('href')
        }));

      return { headings, paragraphs: paragraphs.length, links };
    });

    console.log('Content Structure:');
    console.log('- Headings:', contentAnalysis.headings);
    console.log('- Paragraphs:', contentAnalysis.paragraphs);
    console.log('- Links:', contentAnalysis.links.length);
    console.log('- Links without href:', contentAnalysis.links.filter(l => !l.hasHref).length);
  });

  test('Best Practices - Meta Tags & SEO', async ({ page }) => {
    const metaInfo = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
        charset: document.querySelector('meta[charset]')?.getAttribute('charset'),
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
        lang: document.documentElement.lang
      };
    });

    console.log('Meta Information:');
    Object.entries(metaInfo).forEach(([key, value]) => {
      if (!value) {
        console.warn(`⚠️  Missing: ${key}`);
      } else {
        console.log(`✓ ${key}:`, value);
      }
    });
  });

  test('Error States - 404, Network Failures', async ({ page }) => {
    // Test 404 page
    const response = await page.goto(baseUrl + '/nonexistent-page', { waitUntil: 'networkidle' });
    console.log('404 page status:', response?.status());

    await page.screenshot({ path: '/tmp/fleet-404-page.png' });

    // Check for user-friendly error message
    const hasErrorMessage = await page.locator('text=/error|not found|404/i').count() > 0;
    console.log('Has error message:', hasErrorMessage);
  });

  test('Component Spacing & Layout Grid', async ({ page }) => {
    // Check consistent spacing
    const spacingAnalysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
      const gaps: number[] = [];

      for (let i = 0; i < cards.length - 1; i++) {
        const rect1 = cards[i].getBoundingClientRect();
        const rect2 = cards[i + 1].getBoundingClientRect();
        const gap = rect2.top - rect1.bottom;
        if (gap >= 0) gaps.push(Math.round(gap));
      }

      return {
        cardCount: cards.length,
        gaps: gaps,
        uniqueGaps: [...new Set(gaps)]
      };
    });

    console.log('Spacing Analysis:');
    console.log('- Cards found:', spacingAnalysis.cardCount);
    console.log('- Unique gaps:', spacingAnalysis.uniqueGaps);

    if (spacingAnalysis.uniqueGaps.length > 3) {
      console.warn('⚠️  Inconsistent spacing detected');
    }
  });

  test('API Integration - Real Data Loading', async ({ page }) => {
    // Wait for API calls
    const apiResponses: any[] = [];

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          contentType: response.headers()['content-type']
        });
      }
    });

    await page.reload({ waitUntil: 'networkidle' });

    console.log('API Calls:', apiResponses.length);
    apiResponses.forEach(api => {
      console.log(`  ${api.status} - ${api.url.split('/').slice(-2).join('/')}`);
    });

    // Check if data loaded successfully
    const hasVehicleData = await page.locator('text=/VEH[0-9]+|Ford|Chevrolet|Mercedes/i').count() > 0;
    console.log('Vehicle data loaded:', hasVehicleData);
  });
});
