import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

const askQuestion = (query: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
};

(async () => {
  console.log('🌐 Đang mở Chrome với cấu hình Stealth để bypass Cloudflare...');

  const userDataDir = path.join(process.cwd(), 'user_data');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(path.join(userDataDir, 'chrome-profile'), {
    headless: false,
    channel: 'chrome',
    viewport: null,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  await page.goto('https://wallet.moonstake.io/admin/assets-list');

  console.log('\n==================================================');
  console.log('👉 Vui lòng ĐĂNG NHẬP và tích chọn Cloudflare Turnstile.');
  console.log('👉 Đợi trang load hoàn tất danh sách Assets.');
  console.log('👉 Quay lại Terminal này và nhấn phím [ENTER] để lưu session!');
  console.log('==================================================\n');

  await askQuestion('Thao tác xong thì nhấn ENTER tại đây để tiếp tục... ');

  // Chờ 2 giây đảm bảo dữ liệu ghi xong
  await page.waitForTimeout(2000);

  console.log('⏳ Đang xuất Cookies & LocalStorage ra user_data/state.json...');
  await context.storageState({ path: path.join(userDataDir, 'state.json') });

  console.log('🎉 Đã lưu state.json thành công!');
  await context.close();
})();