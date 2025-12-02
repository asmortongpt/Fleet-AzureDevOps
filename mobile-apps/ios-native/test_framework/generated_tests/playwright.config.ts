import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Fleet Management Test Suite
 *
 * This configuration is optimized for comprehensive testing including:
 * - E2E functional tests
 * - Accessibility tests
 * - Performance tests
 * - Cross-component integration tests
 */

export default defineConfig({
  // Test directory
  testDir: './',

  // Maximum time one test can run
  timeout: 60000,

  // Global timeout for the entire test run
  globalTimeout: 3600000, // 1 hour

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 1,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 4,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
    // GitHub Actions reporter
    process.env.CI ? ['github'] : null,
  ].filter(Boolean) as any,

  // Shared settings for all projects
  use: {
    // Base URL for tests - now supports production URL via environment variable
    baseURL: process.env.BASE_URL || 'http://68.220.148.2',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Navigation timeout - increased for production
    navigationTimeout: 45000,

    // Action timeout - increased for production network conditions
    actionTimeout: 20000,

    // Viewport size
    viewport: { width: 1920, height: 1080 },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Locale
    locale: 'en-US',

    // Timezone
    timezoneId: 'America/New_York',

    // Color scheme
    colorScheme: 'light',

    // Storage state for authentication persistence
    storageState: process.env.STORAGE_STATE || undefined,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    // Tablet browsers
    {
      name: 'tablet-ipad',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  // Run local dev server before starting tests (disabled when BASE_URL is set to production)
  webServer: process.env.CI || process.env.BASE_URL === 'http://68.220.148.2'
    ? undefined
    : {
        command: 'cd ../../../.. && npm run dev',
        url: 'http://localhost:5000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        stdout: 'ignore',
        stderr: 'pipe',
      },

  // Output folder for test artifacts
  outputDir: 'test-results/artifacts',

  // Folder for snapshots
  snapshotDir: 'test-results/snapshots',

  // Update snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',
});
