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

  // Sử dụng launchPersistentContext để giả lập profile thật & xóa sạch dấu vết Automation
  const context = await chromium.launchPersistentContext(path.join(userDataDir, 'chrome-profile'), {
    headless: false,
    channel: 'chrome', // Dùng Google Chrome thật cài trên máy
    viewport: null, // Mở full màn hình tự nhiên
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled', // Xóa cờ báo Automation
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    ignoreDefaultArgs: ['--enable-automation'], // Bỏ bớt cờ báo Playwright automation
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // Override thuộc tính navigator.webdriver trên trang
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  // Truy cập trang login / assets list
  await page.goto('https://wallet.moonstake.io/admin/assets-list');

  console.log('\n==================================================');
  console.log('👉 Vui lòng ĐĂNG NHẬP và tích chọn Cloudflare Turnstile.');
  console.log('👉 Sau khi đã vào đến trang bên trong (Assets List / Dashboard):');
  console.log('👉 Quay lại Terminal này và nhấn phím [ENTER] để lưu session!');
  console.log('==================================================\n');

  await askQuestion('Thao tác xong thì nhấn ENTER tại đây để tiếp tục... ');

  console.log('⏳ Đang xuất Cookies & LocalStorage ra user_data/state.json...');

  // Lưu lại Session vào file state.json cho Playwright Test
  await context.storageState({ path: path.join(userDataDir, 'state.json') });

  console.log('🎉 Đã lưu state.json thành công! Đang đóng trình duyệt...');
  await context.close();
})();