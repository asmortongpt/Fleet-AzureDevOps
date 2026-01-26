import { defineConfig, devices } from '@playwright/test'

/**
 * Minimal Playwright Config for Local Testing
 * No database setup/teardown - just frontend and API endpoint testing
 */
export default defineConfig({
  testDir: './',
  testMatch: 'test-local-fleet.spec.ts',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  timeout: 30000,

  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    }
  ],
})
