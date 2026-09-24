import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const userDataDir = path.join(__dirname, '../user_data');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // Khởi tạo browser context với userDataDir để bypass Cloudflare
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Hiện UI ở bước setup để bạn bypass Cloudflare
  });

  const page = await context.newPage();
  await page.goto('https://wallet.moonstake.io/admin/assets-list');

  console.log('👉 Hãy hoàn tất Cloudflare / Login trên trình duyệt...');
  
  // Chờ cho đến khi chuyển vào đúng trang admin (đã login thành công)
  await page.waitForURL(/.*admin\/assets-list/i, { timeout: 120000 });

  // 💥 BƯỚC QUAN TRỌNG: Lưu storage state (Cookies, LocalStorage) ra file json
  await context.storageState({ path: './user_data/state.json' });

  await context.close();
  console.log('✅ Đã lưu session vào ./user_data/state.json thành công!');
}

export default globalSetup;