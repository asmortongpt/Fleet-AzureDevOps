import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for smoke tests in the orchestrator.
 * This is a minimal config focused on fast, essential checks.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.smoke\.spec\.ts/,

  // Run tests in parallel
  fullyParallel: true,

  // Fail fast - stop on first failure
  maxFailures: 1,

  // Forbid test.only in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests once
  retries: process.env.CI ? 1 : 0,

  // Single worker for smoke tests (fast and focused)
  workers: 1,

  // Reporter
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/smoke-test-results.json' }],
    ['html', { outputFolder: 'test-results/smoke-test-report', open: 'never' }]
  ],

  // Shared test configuration
  use: {
    // Base URL from environment or default
    baseURL: process.env.BASE_URL || 'https://purple-river-0f465960f.3.azurestaticapps.net',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: false,

    // Timeout
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 60000,

  // Global timeout for the entire test run
  globalTimeout: 300000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No dev server - we test deployed apps
  webServer: undefined,
});
