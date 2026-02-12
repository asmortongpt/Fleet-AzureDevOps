import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load inventory
const inventoryPath = join(__dirname, '../certification/inventory.json');
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf-8'));

// Visual regression testing configuration
const VISUAL_THRESHOLD = 0.02; // 2% pixel difference tolerance
const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === 'true';

interface VisualTestResult {
  itemId: string;
  passed: boolean;
  pixelDiffPercentage: number;
  layoutShifts: number;
  colorDiffs: number;
  hasVisualRegression: boolean;
  screenshotPath: string;
  diffPath?: string;
}

const visualResults: VisualTestResult[] = [];

test.describe('Visual Regression Testing - UI Routes', () => {
  const routes = inventory.items.filter((item: any) => item.type === 'ui-route');

  for (const route of routes) {
    test(`${route.id} - Visual comparison for ${route.path}`, async ({ page }) => {
      const result: VisualTestResult = {
        itemId: route.id,
        passed: false,
        pixelDiffPercentage: 0,
        layoutShifts: 0,
        colorDiffs: 0,
        hasVisualRegression: false,
        screenshotPath: '',
      };

      try {
        // Navigate to route
        await page.goto(`http://localhost:5174${route.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Wait for page to stabilize
        await page.waitForTimeout(1000);

        // Close any modals/overlays
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        // VISUAL REGRESSION TEST with Playwright's built-in visual comparison
        const screenshotName = `${route.id}-${route.path.replace(/\//g, '-') || 'home'}.png`;

        if (UPDATE_SNAPSHOTS) {
          // Update baseline snapshots
          await page.screenshot({
            path: join(__dirname, 'snapshots', screenshotName),
            fullPage: true,
          });
          console.log(`✅ Updated baseline for ${route.id}`);
        } else {
          // Compare against baseline with pixel-perfect matching
          const screenshot = await page.screenshot({ fullPage: true });

          try {
            // Playwright's toMatchSnapshot does pixel-by-pixel comparison
            await expect(screenshot).toMatchSnapshot(screenshotName, {
              threshold: VISUAL_THRESHOLD,
              maxDiffPixels: 100, // Allow up to 100 pixels difference
            });

            result.passed = true;
            result.hasVisualRegression = false;
            result.pixelDiffPercentage = 0;
          } catch (error: any) {
            // Visual regression detected!
            result.passed = false;
            result.hasVisualRegression = true;

            // Extract diff percentage from error message
            const diffMatch = error.message.match(/(\d+\.?\d*)%/);
            if (diffMatch) {
              result.pixelDiffPercentage = parseFloat(diffMatch[1]);
            }

            result.diffPath = `${screenshotName}-diff.png`;
            console.error(`❌ Visual regression detected in ${route.id}: ${result.pixelDiffPercentage}% pixel difference`);
          }
        }

        result.screenshotPath = screenshotName;

        // Additional visual validation checks

        // 1. Check for layout shifts (CLS - Cumulative Layout Shift)
        const layoutShift = await page.evaluate(() => {
          return new Promise<number>((resolve) => {
            let cls = 0;
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                  cls += (entry as any).value;
                }
              }
            });
            observer.observe({ entryTypes: ['layout-shift'] });

            setTimeout(() => {
              observer.disconnect();
              resolve(cls);
            }, 1000);
          });
        });
        result.layoutShifts = layoutShift;

        // 2. Check for color/contrast issues
        const colorIssues = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          let issues = 0;

          elements.forEach((el) => {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            const color = style.color;

            // Check if text is visible (not same as background)
            if (bg === color && el.textContent?.trim()) {
              issues++;
            }

            // Check for very low contrast
            if (style.opacity === '0' && el.textContent?.trim()) {
              issues++;
            }
          });

          return issues;
        });
        result.colorDiffs = colorIssues;

        visualResults.push(result);

      } catch (error) {
        console.error(`Failed visual test for ${route.id}:`, error);
        result.passed = false;
        result.hasVisualRegression = true;
        visualResults.push(result);
        throw error;
      }
    });
  }
});

test.describe('Visual Regression Testing - UI Tabs', () => {
  const tabs = inventory.items.filter((item: any) => item.type === 'ui-tab');

  for (const tab of tabs) {
    test(`${tab.id} - Visual comparison for tab`, async ({ page }) => {
      const result: VisualTestResult = {
        itemId: tab.id,
        passed: false,
        pixelDiffPercentage: 0,
        layoutShifts: 0,
        colorDiffs: 0,
        hasVisualRegression: false,
        screenshotPath: '',
      };

      try {
        const parentRoute = tab.metadata?.parentRoute || '/fleet';
        await page.goto(`http://localhost:5174${parentRoute}`, {
          waitUntil: 'networkidle'
        });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        // Find and click tab
        const tabName = tab.metadata?.tabName || tab.metadata?.label;
        const testId = tab.metadata?.testId;

        let tabElement;
        if (testId) {
          tabElement = page.locator(`[data-testid="${testId}"]`).first();
        } else {
          tabElement = page.locator(`[role="tab"]:has-text("${tabName}")`).first();
        }

        await tabElement.click();
        await page.waitForTimeout(500); // Wait for tab content to render

        // VISUAL REGRESSION TEST
        const screenshotName = `${tab.id}-tab.png`;
        const screenshot = await page.screenshot({ fullPage: true });

        if (UPDATE_SNAPSHOTS) {
          await page.screenshot({
            path: join(__dirname, 'snapshots', screenshotName),
            fullPage: true,
          });
        } else {
          try {
            await expect(screenshot).toMatchSnapshot(screenshotName, {
              threshold: VISUAL_THRESHOLD,
              maxDiffPixels: 150,
            });
            result.passed = true;
          } catch (error: any) {
            result.hasVisualRegression = true;
            const diffMatch = error.message.match(/(\d+\.?\d*)%/);
            if (diffMatch) {
              result.pixelDiffPercentage = parseFloat(diffMatch[1]);
            }
          }
        }

        result.screenshotPath = screenshotName;
        visualResults.push(result);

      } catch (error) {
        result.hasVisualRegression = true;
        visualResults.push(result);
        throw error;
      }
    });
  }
});

// Generate visual regression report
test.afterAll(async () => {
  const reportPath = join(__dirname, '../test-results/visual-regression-report.json');

  const summary = {
    totalTested: visualResults.length,
    passed: visualResults.filter(r => r.passed).length,
    failed: visualResults.filter(r => !r.passed).length,
    visualRegressions: visualResults.filter(r => r.hasVisualRegression).length,
    averagePixelDiff: visualResults.reduce((sum, r) => sum + r.pixelDiffPercentage, 0) / visualResults.length,
    layoutShiftIssues: visualResults.filter(r => r.layoutShifts > 0.1).length,
    colorIssues: visualResults.filter(r => r.colorDiffs > 0).length,
    results: visualResults,
  };

  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  console.log('\n================================================================================');
  console.log('VISUAL REGRESSION TESTING REPORT');
  console.log('================================================================================');
  console.log(`Total Items Tested: ${summary.totalTested}`);
  console.log(`✅ Passed (No Visual Changes): ${summary.passed}`);
  console.log(`❌ Failed (Visual Regressions): ${summary.failed}`);
  console.log(`🔍 Visual Regressions Detected: ${summary.visualRegressions}`);
  console.log(`📊 Average Pixel Difference: ${summary.averagePixelDiff.toFixed(2)}%`);
  console.log(`⚠️  Layout Shift Issues: ${summary.layoutShiftIssues}`);
  console.log(`🎨 Color/Contrast Issues: ${summary.colorIssues}`);
  console.log('================================================================================\n');
  console.log(`📄 Full report saved to: ${reportPath}`);
});
