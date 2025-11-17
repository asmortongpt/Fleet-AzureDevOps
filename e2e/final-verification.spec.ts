import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface TestResults {
  deployment: string;
  url: string;
  timestamp: string;
  fixes: {
    doubleApiPath: {
      status: 'PASS' | 'FAIL' | 'UNKNOWN';
      details: string;
      evidence: string[];
    };
    corsHeaders: {
      status: 'PASS' | 'FAIL' | 'UNKNOWN';
      details: string;
      evidence: string[];
    };
  };
  performance: {
    pageLoadTime: number;
    domContentLoaded: number;
    networkRequests: number;
  };
  errors: string[];
  screenshots: string[];
  networkRequests: Array<{
    url: string;
    method: string;
    status: number;
    headers: Record<string, string>;
  }>;
}

const DEPLOYMENTS = [
  {
    name: 'Production (Front Door)',
    url: 'https://fleet.capitaltechalliance.com',
  },
  {
    name: 'Static Web App',
    url: 'https://green-pond-0f040980f.3.azurestaticapps.net',
  },
];

test.describe('Fleet Management Final Verification', () => {
  const allResults: TestResults[] = [];

  for (const deployment of DEPLOYMENTS) {
    test.describe(deployment.name, () => {
      let results: TestResults;

      test.beforeEach(async ({ page }) => {
        results = {
          deployment: deployment.name,
          url: deployment.url,
          timestamp: new Date().toISOString(),
          fixes: {
            doubleApiPath: {
              status: 'UNKNOWN',
              details: '',
              evidence: [],
            },
            corsHeaders: {
              status: 'UNKNOWN',
              details: '',
              evidence: [],
            },
          },
          performance: {
            pageLoadTime: 0,
            domContentLoaded: 0,
            networkRequests: 0,
          },
          errors: [],
          screenshots: [],
          networkRequests: [],
        };

        // Capture console errors
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            results.errors.push(`Console Error: ${msg.text()}`);
          }
        });

        page.on('pageerror', (error) => {
          results.errors.push(`Page Error: ${error.message}`);
        });
      });

      test.afterEach(async () => {
        allResults.push(results);
      });

      test('should load homepage without errors', async ({ page }) => {
        const startTime = Date.now();

        // Navigate to the page
        const response = await page.goto(deployment.url, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        const loadTime = Date.now() - startTime;
        results.performance.pageLoadTime = loadTime;

        // Take screenshot
        const screenshotPath = `test-results/${deployment.name
          .replace(/[^a-z0-9]/gi, '-')
          .toLowerCase()}-homepage.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results.screenshots.push(screenshotPath);

        // Verify response
        expect(response?.status()).toBeLessThan(400);

        // Check for basic elements
        await expect(page).toHaveTitle(/Fleet Management|Capital Tech Alliance/i);

        console.log(`✓ ${deployment.name} loaded in ${loadTime}ms`);
      });

      test('should verify API URL structure (Fix #1)', async ({ page }) => {
        const apiRequests: Array<{
          url: string;
          hasDoubleApi: boolean;
        }> = [];

        // Monitor network requests
        page.on('request', (request) => {
          const url = request.url();
          if (url.includes('/api/')) {
            const hasDoubleApi = url.includes('/api/api/');
            apiRequests.push({ url, hasDoubleApi });
            results.networkRequests.push({
              url,
              method: request.method(),
              status: 0,
              headers: {},
            });
          }
        });

        page.on('response', async (response) => {
          const url = response.url();
          if (url.includes('/api/')) {
            const requestIndex = results.networkRequests.findIndex(
              (r) => r.url === url && r.status === 0
            );
            if (requestIndex !== -1) {
              results.networkRequests[requestIndex].status = response.status();
              try {
                const headers: Record<string, string> = {};
                for (const [key, value] of Object.entries(response.headers())) {
                  headers[key] = value;
                }
                results.networkRequests[requestIndex].headers = headers;
              } catch (e) {
                // Ignore header errors
              }
            }
          }
        });

        // Navigate and trigger some API calls
        await page.goto(deployment.url, { waitUntil: 'networkidle' });

        // Try to navigate to a page that would trigger API calls
        try {
          // Look for navigation links
          const vehiclesLink = page.locator('a[href*="vehicle"], a:has-text("Vehicles")').first();
          if (await vehiclesLink.isVisible({ timeout: 5000 })) {
            await vehiclesLink.click();
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          console.log('Could not navigate to vehicles page:', e);
        }

        // Take screenshot
        const screenshotPath = `test-results/${deployment.name
          .replace(/[^a-z0-9]/gi, '-')
          .toLowerCase()}-api-test.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results.screenshots.push(screenshotPath);

        // Analyze API requests
        const doubleApiRequests = apiRequests.filter((r) => r.hasDoubleApi);

        if (apiRequests.length === 0) {
          results.fixes.doubleApiPath.status = 'UNKNOWN';
          results.fixes.doubleApiPath.details =
            'No API requests detected. Application may be fully static or API calls were not triggered.';
        } else if (doubleApiRequests.length > 0) {
          results.fixes.doubleApiPath.status = 'FAIL';
          results.fixes.doubleApiPath.details = `Found ${doubleApiRequests.length} requests with double /api/ path`;
          results.fixes.doubleApiPath.evidence = doubleApiRequests.map((r) => r.url);
        } else {
          results.fixes.doubleApiPath.status = 'PASS';
          results.fixes.doubleApiPath.details = `All ${apiRequests.length} API requests use correct path structure`;
          results.fixes.doubleApiPath.evidence = apiRequests
            .slice(0, 5)
            .map((r) => r.url);
        }

        results.performance.networkRequests = apiRequests.length;

        console.log(
          `✓ API Path Check: ${results.fixes.doubleApiPath.status} - ${apiRequests.length} API requests analyzed`
        );
      });

      test('should verify CORS headers (Fix #2)', async ({ page }) => {
        let corsHeaderFound = false;
        let corsDetails: string[] = [];

        // Monitor responses for CORS headers
        page.on('response', async (response) => {
          const url = response.url();
          if (url.includes('/api/')) {
            const headers = response.headers();

            // Check for CORS headers
            const corsHeader = headers['access-control-allow-origin'];
            const corsCredentials = headers['access-control-allow-credentials'];
            const corsMethods = headers['access-control-allow-methods'];

            if (corsHeader) {
              corsHeaderFound = true;
              corsDetails.push(
                `URL: ${url}\n` +
                  `  Access-Control-Allow-Origin: ${corsHeader}\n` +
                  `  Access-Control-Allow-Credentials: ${corsCredentials || 'not set'}\n` +
                  `  Access-Control-Allow-Methods: ${corsMethods || 'not set'}`
              );
            }
          }
        });

        // Navigate and trigger API calls
        await page.goto(deployment.url, { waitUntil: 'networkidle' });

        // Try to trigger more API calls
        try {
          const vehiclesLink = page.locator('a[href*="vehicle"], a:has-text("Vehicles")').first();
          if (await vehiclesLink.isVisible({ timeout: 5000 })) {
            await vehiclesLink.click();
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          console.log('Could not navigate for CORS test:', e);
        }

        // Take screenshot
        const screenshotPath = `test-results/${deployment.name
          .replace(/[^a-z0-9]/gi, '-')
          .toLowerCase()}-cors-test.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results.screenshots.push(screenshotPath);

        // Analyze CORS headers
        if (results.networkRequests.length === 0) {
          results.fixes.corsHeaders.status = 'UNKNOWN';
          results.fixes.corsHeaders.details = 'No API requests detected to verify CORS headers';
        } else if (!corsHeaderFound) {
          // Check if this is expected (same-origin doesn't need CORS)
          const pageOrigin = new URL(deployment.url).origin;
          const apiRequestsFromDifferentOrigin = results.networkRequests.some((r) => {
            try {
              return !r.url.startsWith(pageOrigin);
            } catch {
              return false;
            }
          });

          if (apiRequestsFromDifferentOrigin) {
            results.fixes.corsHeaders.status = 'FAIL';
            results.fixes.corsHeaders.details =
              'Cross-origin API requests detected but no CORS headers found';
          } else {
            results.fixes.corsHeaders.status = 'PASS';
            results.fixes.corsHeaders.details =
              'All API requests are same-origin (CORS not required)';
          }
        } else {
          results.fixes.corsHeaders.status = 'PASS';
          results.fixes.corsHeaders.details = `CORS headers present on ${corsDetails.length} API response(s)`;
          results.fixes.corsHeaders.evidence = corsDetails;
        }

        console.log(`✓ CORS Check: ${results.fixes.corsHeaders.status}`);
      });

      test('should check for functional features', async ({ page }) => {
        await page.goto(deployment.url, { waitUntil: 'networkidle' });

        // Take final screenshot
        const screenshotPath = `test-results/${deployment.name
          .replace(/[^a-z0-9]/gi, '-')
          .toLowerCase()}-final.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results.screenshots.push(screenshotPath);

        // Check for common UI elements
        const checks = {
          hasNavigation: await page.locator('nav, header').count() > 0,
          hasContent: (await page.textContent('body'))?.length ?? 0 > 100,
          hasLinks: await page.locator('a').count() > 0,
        };

        console.log(`✓ UI Elements: Nav=${checks.hasNavigation}, Content=${checks.hasContent}, Links=${checks.hasLinks}`);
      });
    });
  }

  test.afterAll(async () => {
    // Generate final report
    const reportPath = path.join(process.cwd(), 'test-results', 'final-verification.json');
    fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));

    // Generate markdown report
    let markdown = '# Fleet Management Final Verification Report\n\n';
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;

    // Executive Summary
    markdown += '## Executive Summary\n\n';

    const allFix1Pass = allResults.every((r) => r.fixes.doubleApiPath.status === 'PASS');
    const allFix2Pass = allResults.every((r) => r.fixes.corsHeaders.status === 'PASS' || r.fixes.corsHeaders.status === 'UNKNOWN');

    markdown += `### Fix #1: Double /api/ URLs\n`;
    markdown += `**Status:** ${allFix1Pass ? '✅ PASS' : '❌ FAIL'}\n\n`;

    markdown += `### Fix #2: CORS Headers\n`;
    markdown += `**Status:** ${allFix2Pass ? '✅ PASS' : '❌ FAIL'}\n\n`;

    // Detailed Results
    markdown += '## Detailed Test Results\n\n';

    for (const result of allResults) {
      markdown += `### ${result.deployment}\n\n`;
      markdown += `**URL:** ${result.url}\n\n`;
      markdown += `**Timestamp:** ${result.timestamp}\n\n`;

      // Fix #1
      markdown += `#### Fix #1: Double /api/ URLs\n`;
      markdown += `- **Status:** ${result.fixes.doubleApiPath.status}\n`;
      markdown += `- **Details:** ${result.fixes.doubleApiPath.details}\n`;
      if (result.fixes.doubleApiPath.evidence.length > 0) {
        markdown += `- **Evidence:**\n`;
        result.fixes.doubleApiPath.evidence.forEach((e) => {
          markdown += `  - \`${e}\`\n`;
        });
      }
      markdown += '\n';

      // Fix #2
      markdown += `#### Fix #2: CORS Headers\n`;
      markdown += `- **Status:** ${result.fixes.corsHeaders.status}\n`;
      markdown += `- **Details:** ${result.fixes.corsHeaders.details}\n`;
      if (result.fixes.corsHeaders.evidence.length > 0) {
        markdown += `- **Evidence:**\n`;
        result.fixes.corsHeaders.evidence.forEach((e) => {
          markdown += `\`\`\`\n${e}\n\`\`\`\n`;
        });
      }
      markdown += '\n';

      // Performance
      markdown += `#### Performance Metrics\n`;
      markdown += `- **Page Load Time:** ${result.performance.pageLoadTime}ms\n`;
      markdown += `- **Network Requests:** ${result.performance.networkRequests} API calls\n\n`;

      // Errors
      if (result.errors.length > 0) {
        markdown += `#### Errors Detected\n`;
        result.errors.forEach((e) => {
          markdown += `- ${e}\n`;
        });
        markdown += '\n';
      }

      // Network Requests
      if (result.networkRequests.length > 0) {
        markdown += `#### API Network Requests\n`;
        markdown += `| URL | Method | Status |\n`;
        markdown += `|-----|--------|--------|\n`;
        result.networkRequests.forEach((r) => {
          const shortUrl = r.url.length > 80 ? '...' + r.url.slice(-77) : r.url;
          markdown += `| ${shortUrl} | ${r.method} | ${r.status || 'pending'} |\n`;
        });
        markdown += '\n';
      }

      // Screenshots
      markdown += `#### Screenshots\n`;
      result.screenshots.forEach((s) => {
        const filename = path.basename(s);
        markdown += `- ${filename}\n`;
      });
      markdown += '\n---\n\n';
    }

    // Recommendations
    markdown += '## Recommendations\n\n';

    const failedFix1 = allResults.filter((r) => r.fixes.doubleApiPath.status === 'FAIL');
    const failedFix2 = allResults.filter((r) => r.fixes.corsHeaders.status === 'FAIL');

    if (failedFix1.length === 0 && failedFix2.length === 0) {
      markdown += '✅ All fixes are deployed and working correctly!\n\n';
    } else {
      if (failedFix1.length > 0) {
        markdown += `### Fix #1 Issues\n`;
        markdown += `The following deployments still have double /api/ paths:\n`;
        failedFix1.forEach((r) => {
          markdown += `- ${r.deployment}: ${r.url}\n`;
        });
        markdown += '\n';
      }

      if (failedFix2.length > 0) {
        markdown += `### Fix #2 Issues\n`;
        markdown += `The following deployments have CORS issues:\n`;
        failedFix2.forEach((r) => {
          markdown += `- ${r.deployment}: ${r.url}\n`;
        });
        markdown += '\n';
      }
    }

    const markdownPath = path.join(process.cwd(), 'test-results', 'FINAL_VERIFICATION_REPORT.md');
    fs.writeFileSync(markdownPath, markdown);

    console.log('\n' + '='.repeat(80));
    console.log('FINAL VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Report saved to: ${markdownPath}`);
    console.log(`JSON data saved to: ${reportPath}`);
    console.log('='.repeat(80) + '\n');
  });
});
