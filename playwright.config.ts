import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Đọc biến môi trường từ file .env
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    /* Lấy BASE_URL trực tiếp từ biến môi trường */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Ghi hình & chụp ảnh khi test fail */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 1. Setup project: Chạy đăng nhập trước để tạo storageState
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // 2. Project chính: Sử dụng kết quả đăng nhập từ bước setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Tự động load file session đã lưu
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});