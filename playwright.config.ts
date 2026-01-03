import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  timeout: 30000, // Default timeout of 30 seconds per test

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  use: {
    baseURL: process.env.APP_URL || 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Configure test artifacts
  outputDir: 'test-results',

  // Snapshot configuration
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
  },

  projects: [
    // ========== Desktop Browser Testing ==========
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--disable-dev-shm-usage']
        }
      }
    },

    {
      name: 'firefox',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      }
    },

    {
      name: 'webkit',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      }
    },

    // ========== Mobile Testing Projects ==========
    {
      name: 'mobile-chrome',
      testDir: './tests/e2e',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      }
    },

    {
      name: 'mobile-safari',
      testDir: './tests/e2e',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      }
    },

    {
      name: 'tablet-ipad',
      testDir: './tests/e2e',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      }
    },

    // ========== Smoke Tests Project ==========
    {
      name: 'smoke',
      testDir: './tests/smoke',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      retries: 0,
      timeout: 60000,
    },

    // ========== Visual Regression Testing ==========
    {
      name: 'visual-chromium',
      testDir: './tests/visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
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

    // ========== API Testing Project ==========
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_URL || 'http://localhost:3000',
        extraHTTPHeaders: {
          'Accept': 'application/json',
        },
      },
    },

    // ========== Accessibility Testing ==========
    {
      name: 'a11y',
      testDir: './tests/e2e',
      testMatch: '**/accessibility.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      timeout: 60000,
    },

    // ========== Performance Testing ==========
    {
      name: 'performance',
      testDir: './tests/e2e',
      testMatch: '**/performance.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--enable-precise-memory-info', '--disable-dev-shm-usage']
        }
      },
      timeout: 60000,
    },

    // ========== Visual Regression - E2E ==========
    {
      name: 'visual-regression',
      testDir: './tests/e2e',
      testMatch: '**/visual-regression.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        launchOptions: {
          args: [
            '--disable-animations',
            '--disable-smooth-scrolling',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu-vsync',
            '--disable-dev-shm-usage'
          ]
        }
      },
      expect: {
        toHaveScreenshot: {
          maxDiffPixels: 150,
          threshold: 0.2,
          animations: 'disabled',
        },
      },
      timeout: 60000,
    },
  ],

  // Web server configuration for local development
  // Disabled - using already running servers
  // webServer: process.env.CI ? undefined : {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5174',
  //   reuseExistingServer: true,
  //   timeout: 120000
  // }
})