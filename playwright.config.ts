import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  /* Bổ sung Reporter: Xuất HTML Report chi tiết và hiển thị kết quả ra Terminal */
  reporter: [
    ['list'], // Hiển thị tiến trình test ngay trong Terminal
    ['html', { outputFolder: 'playwright-report', open: 'never' }] // Xuất HTML report đầy đủ
  ],

  use: {
    viewport: { width: 1920, height: 1080 },
    storageState: './user_data/state.json',
    
    /* Chạy Headless tự động dựa trên môi trường CI (CI=true trên GitHub Actions, false ở Local) */
    headless: process.env.CI ? true : false,
    
    baseURL: 'https://wallet.moonstake.io',
    channel: 'chrome', // Dùng Chrome thật để tránh bị Cloudflare chặn
    
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    },
  },
});