import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Tạo __dirname và __filename tương thích chuẩn ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Load môi trường từ file .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  /* Chạy test song song */
  fullyParallel: false,
  /* Bỏ qua test.only trên CI */
  forbidOnly: !!process.env.CI,
  /* Thử lại khi thất bại trên CI */
  retries: process.env.CI ? 2 : 0,
  /* Số lượng worker chạy song song */
  workers: process.env.CI ? 1 : undefined,
  /* Định dạng báo cáo */
  reporter: [['html', { open: 'never' }], ['list']],
  
  use: {
    /* Base URL cho các lệnh navigation như page.goto('/') */
    baseURL: process.env.BASE_URL || 'https://wallet.moonstake.io',

    /* Ghi log trace khi retry test thất bại */
    trace: 'on-first-retry',

    /* Tự động nạp file session auth nếu có */
    storageState: path.resolve(__dirname, 'playwright/.auth/user.json'),

    /* Bật chụp ảnh màn hình khi fail */
    screenshot: 'only-on-failure',
  },

  /* Cấu hình chạy trên các trình duyệt */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});


