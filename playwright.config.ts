import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./tests/global-setup'),

  // Cấu hình reporter xuất HTML report
  reporter: [
    ['line'], 
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],

  use: {
    storageState: './user_data/state.json',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './user_data/state.json',
      },
    },
  ],
});