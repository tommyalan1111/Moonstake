import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
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