import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  // 💥 QUAN TRỌNG: Nếu đang chạy trên GitHub Actions (CI), bỏ qua việc mở trình duyệt đòi login thủ công
  if (process.env.CI) {
    console.log('🚀 Đang chạy trên GitHub Actions (CI): Bỏ qua tương tác login thủ công, sử dụng state.json khôi phục từ Secret.');
    return;
  }

  const userDataDir = path.join(__dirname, '../user_data');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
  });

  const page = await context.newPage();
  await page.goto('https://wallet.moonstake.io/admin/assets-list');

  console.log('👉 Hãy hoàn tất Cloudflare / Login trên trình duyệt...');
  await page.waitForURL(/.*admin\/assets-list/i, { timeout: 120000 });

  await context.storageState({ path: './user_data/state.json' });
  await context.close();
  console.log('✅ Đã lưu session vào ./user_data/state.json thành công!');
}

export default globalSetup;