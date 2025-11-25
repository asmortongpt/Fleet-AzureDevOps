import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/react-compatibility-pdca.spec.ts',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/pdca-report' }],
    ['json', { outputFile: 'test-results/pdca-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    }
  ]
})
