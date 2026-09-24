import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Chạy tuần tự để tránh xung đột session
  workers: 1,           // Chỉ dùng 1 worker duy nhất
  reporter: 'html',

  use: {
    /* Cấu hình dùng Google Chrome cài sẵn trên Windows ARM64 */
    channel: 'chrome',
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Dùng Chrome gốc thay cho Chromium bị lỗi
      },
    },
  ],
});