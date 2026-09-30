import { test as setup, chromium } from '@playwright/test';
import path from 'path';

const authFile = 'playwright/.auth/user.json';
// Lưu Chrome User Profile vào thư mục local trong project để không bị dính Incognito Clean Profile
const userDataDir = path.join(__dirname, '../.chrome-user-data');

setup('manual authenticate with persistent chrome profile', async () => {
  setup.setTimeout(180000); // Tăng timeout lên 3 phút cho thao tác thủ công

  console.log('🚀 Đang khởi chạy Google Chrome thực tế với Profile cố định...');

  // 1. Mở Google Chrome thật trên máy (thay vì Playwright Chromium)
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome', // Yêu cầu mở app Google Chrome đã cài trên macOS
    viewport: { width: 1440, height: 900 },
    args: [
      '--disable-blink-features=AutomationControlled', // Ẩn cờ navigator.webdriver
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
    ],
  });

  const page = context.pages()[0] || (await context.newPage());

  // 2. Ghi đè các thuộc tính trình duyệt để xóa dấu vết Automation Bot
  await page.addInitScript(() => {
    // Xóa cờ navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    // Giả lập danh sách plugin trình duyệt chuẩn
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    // Giả lập ngôn ngữ mặc định
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en', 'vi'],
    });
  });

  // 3. Mở URL trang quản lý assets của Moonstake
  const targetUrl = process.env.BASE_URL || 'https://wallet.moonstake.io/admin/assets-list/';
  console.log(`🌐 Đang truy cập: ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

  console.log('\n======================================================');
  console.log('👉 VUI LÒNG TỰ THAO TÁC TRÊN MÀN HÌNH BROWSER:');
  console.log('1. Click chọn ô Cloudflare Turnstile (nếu xuất hiện).');
  console.log('2. Nhập Email & Password để Đăng nhập.');
  console.log('3. Giữ trình duyệt cho đến khi vào hẳn giao diện Dashboard.');
  console.log('======================================================\n');

  // 4. Chờ cho tới khi URL quay trở lại/giữ nguyên ở trang /admin/assets-list (xác nhận đã login thành công)
  await page.waitForURL(
    (url) => url.pathname.includes('/admin/assets-list'),
    { timeout: 120000 }
  );

  // Chờ 3 giây để đảm bảo Cookies và LocalStorage lưu đầy đủ
  await page.waitForTimeout(3000);

  // 5. Trích xuất và ghi Session State ra file user.json cho toàn bộ test suite sử dụng
  await context.storageState({ path: authFile });
  console.log(`🎉 ĐÃ LƯU SESSION THÀNH CÔNG VÀO: ${authFile}`);

  await context.close();
});