import path from 'path';
import { fileURLToPath } from 'url';

// Khởi tạo __dirname chuẩn ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { chromium } from '@playwright/test';

import fs from 'fs';
import readline from 'readline';

const userDataDir = path.join(__dirname, '../.chrome-user-data');
const authDir = path.join(__dirname, '../playwright/.auth');
const authFile = path.join(authDir, 'user.json');

// Hàm tạo giao diện lắng nghe phím Enter từ Terminal
function askQuestion(query: string): Promise<string> {
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
}

async function runAuthSetup() {
  console.log('🚀 Đang khởi chạy Google Chrome thực tế để tạo Session...');

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Khởi chạy Chrome thật với Persistent Profile
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  const page = context.pages()[0] || (await context.newPage());

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  const targetUrl = process.env.BASE_URL || 'https://wallet.moonstake.io/admin/assets-list/';
  console.log(`🌐 Truy cập: ${targetUrl}`);
  await page.goto(targetUrl);

  console.log('\n======================================================');
  console.log('👉 VUI LÒNG THAO TÁC TRÊN CHROME:');
  console.log('1. Giải quyết Cloudflare Turnstile (nếu có).');
  console.log('2. Nhập Username & Password để Đăng nhập.');
  console.log('3. Đảm bảo đã vào được trang Dashboard (/admin/assets-list).');
  console.log('======================================================\n');

  // 💡 GIẢI PHÁP: Treo Terminal cho đến khi bạn nhấn ENTER
  await askQuestion('⌨️  Sau khi đã ĐĂNG NHẬP THÀNH CÔNG trên Chrome, hãy quay lại đây và nhấn [ENTER] để lưu Session...');

  console.log('⏳ Đang trích xuất và lưu session state...');
  await page.waitForTimeout(2000);

  // Lưu Session State ra file user.json
  await context.storageState({ path: authFile });
  console.log(`🎉 ĐÃ LƯU SESSION THÀNH CÔNG VÀO: ${authFile}`);

  await context.close();
  process.exit(0);
}

runAuthSetup().catch((err) => {
  console.error('❌ Lỗi Auth Setup:', err);
  process.exit(1);
});