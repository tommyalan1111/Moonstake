import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    viewport: { width: 1920, height: 1080 },
    // Hoặc bỏ viewport cố định để dùng tối đa màn hình
    // launchOptions: { args: ['--start-maximized'] }
    storageState: './user_data/state.json',
    headless: false,
    baseURL: 'https://wallet.moonstake.io',
    channel: 'chrome', // Dùng Chrome thật thay vì Chromium mặc định
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ],
    },
  },
});