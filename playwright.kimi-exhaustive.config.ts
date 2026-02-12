
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/kimi-exhaustive',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/kimi-exhaustive-report' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    headless: false,  // VISIBLE BROWSER
    slowMo: 500,      // Slow motion so user can see
    viewport: { width: 1920, height: 1080 }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 300000,  // 5 minutes per test
});
