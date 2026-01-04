import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  timeout: 60000, // Increase timeout to 60 seconds per test
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Visual regression testing settings
    ignoreSnapshots: !process.env.UPDATE_SNAPSHOTS,
    // Ignore HTTPS errors for production testing
    ignoreHTTPSErrors: true,
  },
  // Visual snapshot configuration
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  projects: [
    // ========== Production Smoke Tests ==========
    // Run smoke tests with: npm run test:smoke or npm run test:smoke:production
    {
      name: 'smoke-chromium',
      testDir: './tests/smoke',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        baseURL: process.env.PRODUCTION_URL || process.env.APP_URL || 'http://localhost:5173',
      },
      timeout: 60000,
      retries: 1,
    },

    // ========== E2E Testing Projects ==========
    {
      name: 'chromium',
      testDir: './e2e',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    },

    // ========== Mobile Testing Projects ==========
    // Run mobile tests with: npm run test:mobile
    {
      name: 'mobile-iphone',
      testDir: './e2e/mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
      timeout: 90000,
    },
    {
      name: 'mobile-pixel',
      testDir: './e2e/mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
      timeout: 90000,
    },
    {
      name: 'mobile-ipad',
      testDir: './e2e/mobile',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
      timeout: 90000,
    },

    // ========== Browser Testing (Optional) ==========
    // Uncomment for full cross-browser testing
    // {
    //   name: 'firefox',
    //   testDir: './e2e',
    //   use: { ...devices['Desktop Firefox'] }
    // },
    // {
    //   name: 'webkit',
    //   testDir: './e2e',
    //   use: { ...devices['Desktop Safari'] }
    // },

    // ========== Visual Regression Testing Projects ==========
    // Run visual tests with: npm run test:visual
    {
      name: 'visual-chromium',
      testDir: './tests/visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        // Disable animations for consistent screenshots
        launchOptions: {
          args: [
            '--disable-animations',
            '--disable-smooth-scrolling',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu-vsync'
          ]
        }
      },
      expect: {
        toHaveScreenshot: {
          maxDiffPixels: 100,
          threshold: 0.2,
          animations: 'disabled',
        },
      },
    },
    {
      name: 'visual-firefox',
      testDir: './tests/visual',
      testMatch: /cross-browser\.visual\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      expect: {
        toHaveScreenshot: {
          maxDiffPixels: 200,
          threshold: 0.25,
          animations: 'disabled',
        },
      },
    },
    {
      name: 'visual-webkit',
      testDir: './tests/visual',
      testMatch: /cross-browser\.visual\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      expect: {
        toHaveScreenshot: {
          maxDiffPixels: 200,
          threshold: 0.25,
          animations: 'disabled',
        },
      },
    },
    // Mobile visual testing
    {
      name: 'visual-mobile',
      testDir: './tests/visual',
      testMatch: /cross-browser\.visual\.spec\.ts/,
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
      expect: {
        toHaveScreenshot: {
          maxDiffPixels: 150,
          threshold: 0.25,
          animations: 'disabled',
        },
      },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000
      }
})
