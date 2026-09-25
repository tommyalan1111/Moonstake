import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./tests/global-setup'),
  use: {
    // Đọc trạng thái đăng nhập từ file state.json đã dán
    storageState: './user_data/state.json',
    headless: false, // Chạy hiển thị trình duyệt ở local để dễ quan sát
    baseURL: 'https://wallet.moonstake.io',
  },
});