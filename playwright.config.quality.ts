import { defineConfig, devices } from '@playwright/test'

/**
 * Quality Suite Configuration for Playwright
 * No database setup - focused on frontend testing only
 */
export default defineConfig({
  testDir: './tests',
  testMatch: 'comprehensive-quality-suite.spec.ts',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  timeout: 60000,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/quality-report' }],
    ['json', { outputFile: 'test-results/quality-results.json' }]
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'quality-suite',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    }
  ],
})
