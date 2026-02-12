---
name: visual-testing
description: Comprehensive visual and end-to-end testing with automated spidering, screenshot comparison, accessibility auditing, and performance testing. Use this skill when setting up E2E tests, visual regression testing, automated UI testing, or full-application spidering. Trigger when users ask to "test the UI", "set up visual regression", "spider through the app", "test all pages", or "automated E2E testing". Includes Playwright, Percy, BackstopJS, Lighthouse, and comprehensive test automation patterns.
---

# Visual Testing Skill

Complete end-to-end and visual testing with automated spidering, screenshot comparison, and comprehensive quality audits.

## When to Use This Skill

- Setting up end-to-end (E2E) testing
- Visual regression testing (screenshot comparison)
- Automated spidering through all application pages
- Accessibility (a11y) auditing
- Performance testing and Lighthouse audits
- Cross-browser testing
- Mobile responsive testing
- Component visual testing

**Works with**: `frontend-development` (UI components), `production-deployment-skill` (CI/CD integration)

## Technology Stack

### Primary Tools
- **Playwright**: Modern E2E testing framework (multi-browser)
- **Percy**: Visual regression testing service
- **BackstopJS**: Open-source visual regression
- **Lighthouse**: Performance and accessibility auditing
- **Axe**: Accessibility testing
- **Chromatic**: Component visual testing (Storybook)

### Why Playwright?
- ✅ Cross-browser (Chromium, Firefox, WebKit)
- ✅ Auto-wait and retry-ability
- ✅ Built-in screenshots and videos
- ✅ Network interception
- ✅ Mobile emulation
- ✅ Parallel execution
- ✅ Trace viewer for debugging

## Quick Start: Playwright Setup

```bash
# Install Playwright
npm init playwright@latest

# This creates:
# - playwright.config.ts
# - tests/ directory
# - tests-examples/ directory
# - Installs browsers

# Run tests
npx playwright test

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test tests/homepage.spec.ts

# Generate report
npx playwright show-report
```

## Complete Playwright Configuration

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Tablets
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## Automated Spidering

### Spider Through Entire Application

**tests/spider.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'
import * as fs from 'fs'

interface Page {
  url: string
  title: string
  status: number
  links: string[]
  errors: string[]
}

const visited = new Set<string>()
const discovered: Page[] = []
const baseUrl = 'http://localhost:3000'

test.describe('Spider entire application', () => {
  test('crawl all pages and capture details', async ({ page }) => {
    await spider(page, baseUrl)
    
    // Generate report
    const report = generateSpiderReport(discovered)
    fs.writeFileSync('test-results/spider-report.json', JSON.stringify(report, null, 2))
    
    console.log(`✅ Crawled ${visited.size} unique pages`)
    console.log(`✅ Found ${discovered.length} total pages`)
    
    // Assertions
    expect(visited.size).toBeGreaterThan(0)
    expect(discovered.filter(p => p.errors.length > 0).length).toBe(0)
  })
})

async function spider(page: any, url: string, depth: number = 0, maxDepth: number = 5) {
  // Avoid infinite loops and respect depth
  if (visited.has(url) || depth > maxDepth) return
  if (!url.startsWith(baseUrl)) return // Only crawl same domain
  
  visited.add(url)
  console.log(`[${'  '.repeat(depth)}] Crawling: ${url}`)
  
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle' })
    const title = await page.title()
    const status = response?.status() || 0
    
    // Capture console errors
    const errors: string[] = []
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Find all links on page
    const links = await page.$$eval('a[href]', (anchors: any[]) =>
      anchors
        .map(a => a.href)
        .filter(href => href.startsWith(baseUrl))
    )
    
    // Deduplicate links
    const uniqueLinks = Array.from(new Set(links))
    
    // Take screenshot
    await page.screenshot({
      path: `test-results/screenshots/${url.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
      fullPage: true,
    })
    
    // Record page details
    discovered.push({
      url,
      title,
      status,
      links: uniqueLinks,
      errors,
    })
    
    // Recursively crawl discovered links
    for (const link of uniqueLinks) {
      await spider(page, link, depth + 1, maxDepth)
    }
    
  } catch (error) {
    console.error(`❌ Error crawling ${url}:`, error)
    discovered.push({
      url,
      title: 'ERROR',
      status: 0,
      links: [],
      errors: [String(error)],
    })
  }
}

function generateSpiderReport(pages: Page[]) {
  return {
    summary: {
      totalPages: pages.length,
      successfulPages: pages.filter(p => p.status === 200).length,
      failedPages: pages.filter(p => p.status !== 200 || p.errors.length > 0).length,
      totalLinks: pages.reduce((sum, p) => sum + p.links.length, 0),
    },
    pages: pages.map(p => ({
      url: p.url,
      title: p.title,
      status: p.status,
      linkCount: p.links.length,
      hasErrors: p.errors.length > 0,
      errors: p.errors,
    })),
    errors: pages.filter(p => p.errors.length > 0),
  }
}
```

### Enhanced Spider with Accessibility & Performance

**tests/comprehensive-spider.spec.ts**:
```typescript
import { test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import * as fs from 'fs'

interface PageAudit {
  url: string
  timestamp: string
  accessibility: any
  performance: any
  console: string[]
  networkErrors: string[]
  screenshot: string
}

const audits: PageAudit[] = []

test.describe('Comprehensive spider with audits', () => {
  test('crawl with accessibility and performance checks', async ({ page }) => {
    const urls = await discoverUrls(page, 'http://localhost:3000')
    
    for (const url of urls) {
      await auditPage(page, url)
    }
    
    // Generate comprehensive report
    generateAuditReport(audits)
  })
})

async function auditPage(page: any, url: string) {
  console.log(`🔍 Auditing: ${url}`)
  
  const consoleMessages: string[] = []
  const networkErrors: string[] = []
  
  // Capture console messages
  page.on('console', (msg: any) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
  })
  
  // Capture network failures
  page.on('requestfailed', (request: any) => {
    networkErrors.push(`Failed: ${request.url()} - ${request.failure()?.errorText}`)
  })
  
  // Navigate to page
  await page.goto(url, { waitUntil: 'networkidle' })
  
  // Accessibility audit with Axe
  const accessibilityResults = await new AxeBuilder({ page }).analyze()
  
  // Performance metrics
  const performanceMetrics = await page.evaluate(() => ({
    timing: performance.timing,
    navigation: performance.navigation,
    memory: (performance as any).memory,
  }))
  
  // Take screenshot
  const screenshotPath = `test-results/audits/${url.replace(/[^a-zA-Z0-9]/g, '-')}.png`
  await page.screenshot({ path: screenshotPath, fullPage: true })
  
  // Store audit results
  audits.push({
    url,
    timestamp: new Date().toISOString(),
    accessibility: {
      violations: accessibilityResults.violations.length,
      passes: accessibilityResults.passes.length,
      incomplete: accessibilityResults.incomplete.length,
      details: accessibilityResults.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      })),
    },
    performance: performanceMetrics,
    console: consoleMessages,
    networkErrors,
    screenshot: screenshotPath,
  })
  
  // Log violations
  if (accessibilityResults.violations.length > 0) {
    console.log(`  ❌ ${accessibilityResults.violations.length} accessibility violations`)
  } else {
    console.log(`  ✅ No accessibility violations`)
  }
}

async function discoverUrls(page: any, baseUrl: string): Promise<string[]> {
  // Quick sitemap discovery
  const urls = new Set<string>([baseUrl])
  
  try {
    // Try sitemap.xml
    const sitemapResponse = await page.goto(`${baseUrl}/sitemap.xml`)
    if (sitemapResponse?.status() === 200) {
      const sitemapText = await page.content()
      const urlMatches = sitemapText.match(/<loc>(.*?)<\/loc>/g)
      if (urlMatches) {
        urlMatches.forEach((match: string) => {
          const url = match.replace(/<\/?loc>/g, '')
          urls.add(url)
        })
      }
    }
  } catch (e) {
    console.log('  No sitemap found, crawling manually...')
  }
  
  // Fallback: crawl from homepage
  if (urls.size === 1) {
    await page.goto(baseUrl)
    const links = await page.$$eval('a[href]', (anchors: any[]) =>
      anchors.map(a => a.href).filter(href => href.startsWith(baseUrl))
    )
    links.forEach(link => urls.add(link))
  }
  
  return Array.from(urls)
}

function generateAuditReport(audits: PageAudit[]) {
  const report = {
    summary: {
      totalPages: audits.length,
      pagesWithA11yViolations: audits.filter(a => a.accessibility.violations > 0).length,
      pagesWithNetworkErrors: audits.filter(a => a.networkErrors.length > 0).length,
      timestamp: new Date().toISOString(),
    },
    audits: audits.map(a => ({
      url: a.url,
      accessibilityViolations: a.accessibility.violations,
      networkErrors: a.networkErrors.length,
      consoleErrors: a.console.filter(m => m.startsWith('[error]')).length,
    })),
    details: audits,
  }
  
  fs.writeFileSync('test-results/comprehensive-audit.json', JSON.stringify(report, null, 2))
  
  console.log('\n📊 Audit Summary:')
  console.log(`  Total pages: ${report.summary.totalPages}`)
  console.log(`  A11y violations: ${report.summary.pagesWithA11yViolations} pages`)
  console.log(`  Network errors: ${report.summary.pagesWithNetworkErrors} pages`)
  console.log(`  Report saved to: test-results/comprehensive-audit.json`)
}
```

## Visual Regression Testing

### BackstopJS Setup

**Install**:
```bash
npm install --save-dev backstopjs
npx backstop init
```

**backstop.json**:
```json
{
  "id": "visual_regression_tests",
  "viewports": [
    {
      "label": "phone",
      "width": 375,
      "height": 667
    },
    {
      "label": "tablet",
      "width": 768,
      "height": 1024
    },
    {
      "label": "desktop",
      "width": 1920,
      "height": 1080
    }
  ],
  "scenarios": [
    {
      "label": "Homepage",
      "url": "http://localhost:3000",
      "delay": 1000,
      "misMatchThreshold": 0.1
    },
    {
      "label": "Product Catalog",
      "url": "http://localhost:3000/products",
      "delay": 1000,
      "misMatchThreshold": 0.1
    },
    {
      "label": "Shopping Cart",
      "url": "http://localhost:3000/cart",
      "delay": 1000,
      "misMatchThreshold": 0.1
    }
  ],
  "paths": {
    "bitmaps_reference": "backstop_data/bitmaps_reference",
    "bitmaps_test": "backstop_data/bitmaps_test",
    "engine_scripts": "backstop_data/engine_scripts",
    "html_report": "backstop_data/html_report",
    "ci_report": "backstop_data/ci_report"
  },
  "report": ["browser", "CI"],
  "engine": "playwright",
  "engineOptions": {
    "browser": "chromium"
  },
  "asyncCaptureLimit": 5,
  "asyncCompareLimit": 50,
  "debug": false,
  "debugWindow": false
}
```

**Usage**:
```bash
# Create reference screenshots (baseline)
npx backstop reference

# Test current state against baseline
npx backstop test

# Approve changes as new baseline
npx backstop approve

# View report
npx backstop openReport
```

### Percy (Cloud Visual Testing)

**Install**:
```bash
npm install --save-dev @percy/cli @percy/playwright
```

**tests/visual.spec.ts**:
```typescript
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test.describe('Visual regression with Percy', () => {
  test('homepage visual test', async ({ page }) => {
    await page.goto('/')
    await percySnapshot(page, 'Homepage')
  })
  
  test('product catalog visual test', async ({ page }) => {
    await page.goto('/products')
    await percySnapshot(page, 'Product Catalog')
  })
  
  test('responsive visual tests', async ({ page }) => {
    await page.goto('/')
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await percySnapshot(page, 'Homepage - Desktop')
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await percySnapshot(page, 'Homepage - Tablet')
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await percySnapshot(page, 'Homepage - Mobile')
  })
})
```

**Run with Percy**:
```bash
# Set Percy token
export PERCY_TOKEN=your-token

# Run tests with Percy
npx percy exec -- npx playwright test
```

## E2E Test Patterns

### Page Object Model (POM)

**tests/pages/HomePage.ts**:
```typescript
import { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly productCards: Locator
  readonly cartButton: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.locator('[data-testid="search-input"]')
    this.searchButton = page.locator('[data-testid="search-button"]')
    this.productCards = page.locator('[data-testid="product-card"]')
    this.cartButton = page.locator('[data-testid="cart-button"]')
  }

  async goto() {
    await this.page.goto('/')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.searchButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async getProductCount() {
    return await this.productCards.count()
  }

  async clickProduct(index: number) {
    await this.productCards.nth(index).click()
  }

  async goToCart() {
    await this.cartButton.click()
  }
}
```

**tests/homepage.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'

test.describe('Homepage E2E tests', () => {
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page)
    await homePage.goto()
  })

  test('should display products', async () => {
    const count = await homePage.getProductCount()
    expect(count).toBeGreaterThan(0)
  })

  test('should search for products', async () => {
    await homePage.search('tires')
    const count = await homePage.getProductCount()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate to product detail', async () => {
    await homePage.clickProduct(0)
    await expect(homePage.page).toHaveURL(/\/products\/.*/)
  })
})
```

### API Mocking for Consistent Tests

**tests/api-mocked.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'

test('test with mocked API', async ({ page }) => {
  // Intercept API calls
  await page.route('**/api/products', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Product 1', price: 99.99 },
        { id: 2, name: 'Product 2', price: 149.99 },
      ]),
    })
  })

  await page.goto('/products')
  
  // Verify mocked data is displayed
  await expect(page.locator('text=Product 1')).toBeVisible()
  await expect(page.locator('text=Product 2')).toBeVisible()
})
```

## Accessibility Testing

**tests/accessibility.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility audits', () => {
  test('homepage should have no accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('all pages should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocusedElement)
  })

  test('images should have alt text', async ({ page }) => {
    await page.goto('/')
    
    const imagesWithoutAlt = await page.$$eval('img', imgs =>
      imgs.filter(img => !img.getAttribute('alt')).length
    )
    
    expect(imagesWithoutAlt).toBe(0)
  })
})
```

## Performance Testing

**tests/performance.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Performance tests', () => {
  test('homepage should load quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    console.log(`Page load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // Should load in under 3 seconds
  })

  test('Core Web Vitals should be good', async ({ page }) => {
    await page.goto('/')
    
    const metrics = await page.evaluate(() => ({
      LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
      FID: performance.getEntriesByType('first-input')[0]?.processingStart,
      CLS: (performance as any).getEntriesByType('layout-shift')
        .reduce((acc: number, entry: any) => acc + entry.value, 0),
    }))
    
    // Core Web Vitals thresholds
    expect(metrics.LCP).toBeLessThan(2500) // Good: < 2.5s
    // expect(metrics.FID).toBeLessThan(100) // Good: < 100ms
    expect(metrics.CLS).toBeLessThan(0.1) // Good: < 0.1
  })
})
```

## CI/CD Integration

**. github/workflows/e2e-tests.yml**:
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npx playwright test
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 30

  visual-regression:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run BackstopJS tests
        run: |
          npm run dev &
          sleep 5
          npx backstop test || true
      
      - uses: actions/upload-artifact@v3
        with:
          name: backstop-report
          path: backstop_data/html_report/
```

## Best Practices

### Test Organization
✅ Use Page Object Model for maintainability
✅ Group related tests in describe blocks
✅ Use data-testid attributes for selectors
✅ Keep tests independent and isolated
✅ Use fixtures for common setup

### Visual Testing
✅ Set appropriate mismatch thresholds
✅ Test across multiple viewports
✅ Exclude dynamic content (timestamps, ads)
✅ Create baselines in controlled environment
✅ Review changes before approving

### Performance
✅ Run tests in parallel for speed
✅ Use headed mode sparingly (debugging only)
✅ Mock external APIs for consistency
✅ Clean up test data after each run
✅ Use CI/CD caching for dependencies

## Resources

### Bundled Assets
- `scripts/run-full-spider.sh` - Complete spidering script
- `scripts/generate-visual-report.sh` - Visual regression report
- `references/playwright-patterns.md` - Advanced Playwright patterns
- `references/accessibility-checklist.md` - WCAG 2.1 checklist

### Related Skills
- `frontend-development` - UI component patterns
- `production-deployment-skill` - CI/CD integration
- `repo-management` - Test workflows

### External Resources
- Playwright: https://playwright.dev
- Percy: https://percy.io
- BackstopJS: https://github.com/garris/BackstopJS
- Axe: https://www.deque.com/axe/
- Lighthouse: https://developers.google.com/web/tools/lighthouse

## Conclusion

Comprehensive visual and E2E testing catches bugs before users see them. Automated spidering ensures no page is forgotten, visual regression prevents UI regressions, and accessibility testing makes your app usable for everyone.

Remember: Good tests are fast, reliable, and provide clear feedback. Invest in test infrastructure early for long-term confidence in your application.
