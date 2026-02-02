import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporting for certification
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',

    // EVIDENCE CAPTURE: Always capture traces (not just on retry)
    trace: 'on',

    // EVIDENCE CAPTURE: Always capture screenshots
    screenshot: 'on',

    // EVIDENCE CAPTURE: Always record video
    video: 'on',

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Capture HAR (HTTP Archive) for network traffic
    // This captures ALL network requests/responses
    // DISABLED by default as it can be large - enable per test if needed
    // recordHar: {
    //   path: './test-results/network.har',
    //   omitContent: false,
    // },

    // Viewport size
    viewport: { width: 1920, height: 1080 },

    // Ignore HTTPS errors (for local dev)
    ignoreHTTPSErrors: true,

    // Collect console messages
    // (handled in test code with page.on('console'))
  },

  // Output directories for evidence
  outputDir: './test-results/artifacts',

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools Protocol for advanced debugging
        launchOptions: {
          args: ['--enable-logging', '--v=1'],
        },
      },
    },

    // Uncomment to test on additional browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports for responsive testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  webServer: {
    command: 'echo "Dev server should already be running on port 5173"',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 5000,
  },
});
