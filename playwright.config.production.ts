/**
 * Production Testing Playwright Configuration
 * For testing live production deployments without local setup
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  timeout: 120000,
  // NO global setup/teardown - testing live production
  reporter: [
    ['list'],
    ['html', { outputFolder: '/tmp/production-test-results/html-report' }],
    ['json', { outputFile: '/tmp/production-test-results/results.json' }]
  ],
  use: {
    baseURL: 'https://gray-flower-03a2a730f.3.azurestaticapps.net',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  projects: [
    {
      name: 'production-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
})
