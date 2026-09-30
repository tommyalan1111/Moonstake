import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';

// Đường dẫn tới thư mục lưu Profile Chrome cố định
const userDataDir = path.join(__dirname, '../.chrome-user-data');

// Cấu hình loại Asset (coin hoặc token) để script tự chuyển tab tương ứng
const TARGET_ASSETS = [
  { symbol: 'AVAX', name: 'AVAX', type: 'coin' },
  { symbol: 'USDT', name: 'USDT (ERC20)', type: 'token' },
  { symbol: 'ETH', name: 'ETH (NATIVE)', type: 'coin' },
  { symbol: 'XTZ', name: 'XTZ (TEZOS)', type: 'coin' },
  { symbol: 'MATIC', name: 'MATIC (NATIVE)', type: 'coin' },
];

/**
 * Hàm hỗ trợ bóc tách thông tin Balance và USD Value của riêng Token/Coin cần tìm
 */
async function getUiTokenBalance(page: Page, symbol: string) {
  // Tìm chính xác dòng chứa mã Token/Coin
  const coinRow = page
    .locator('tr, div')
    .filter({ hasText: new RegExp(`\\b${symbol}\\b`, 'i') })
    .first();

  if (await coinRow.isVisible().catch(() => false)) {
    const rawText = await coinRow.innerText();
    const cleanText = rawText.replace(/\s+/g, ' ').trim();

    // Regex bóc tách số lượng Token (Ví dụ: "0.290661 AVAX" hoặc "0 USDT")
    const amountMatch = cleanText.match(new RegExp(`([\\d\\.,]+\\s*${symbol})`, 'i'));
    // Regex bóc tách giá trị quy đổi USD (Ví dụ: "3.25 USD")
    const usdMatch = cleanText.match(/([\d\.,]+\s*USD)/i);

    return {
      amount: amountMatch ? amountMatch[1] : `0 ${symbol}`,
      usd: usdMatch ? usdMatch[1] : '0 USD',
      found: true
    };
  }

  return { amount: `Not Found`, usd: '0 USD', found: false };
}

test.describe('On-Chain Balance Integrity Verification', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    console.log('🚀 Khởi chạy Google Chrome thực tế với Persistent Profile...');

    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome',
      viewport: { width: 1440, height: 900 },
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    page = context.pages()[0] || (await context.newPage());

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    const targetUrl = process.env.BASE_URL || 'https://wallet.moonstake.io/admin/assets-list/';
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    if (page.url().includes('/sign-in') || page.url().includes('/login')) {
      throw new Error(
        '❌ Session đã hết hạn hoặc chưa hoàn tất Auth Setup. Vui lòng chạy lại: npx playwright test tests/auth-setup.spec.ts --project=setup --headed'
      );
    }
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  for (const asset of TARGET_ASSETS) {
    test(`Verify balance for ${asset.name}`, async () => {
      const targetUrl = process.env.BASE_URL || 'https://wallet.moonstake.io/admin/assets-list/';
      if (!page.url().includes('/admin/assets-list')) {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      }

      // 1. Chuyển tab tương ứng nếu là Token ERC20
      if (asset.type === 'token') {
        const tokenTab = page.locator('text=/\\bTokens\\b/i').first();
        if (await tokenTab.isVisible().catch(() => false)) {
          await tokenTab.click();
          await page.waitForTimeout(1500); // Chờ UI load danh sách Tokens
        }
      } else {
        const coinTab = page.locator('text=/\\bCoins\\b/i').first();
        if (await coinTab.isVisible().catch(() => false)) {
          await coinTab.click();
          await page.waitForTimeout(1000);
        }
      }

      // 2. Chờ dòng chứa Symbol hiển thị
      const coinRow = page
        .locator('tr, div')
        .filter({ hasText: new RegExp(`\\b${asset.symbol}\\b`, 'i') })
        .first();

      await expect(coinRow).toBeVisible({ timeout: 15000 });

      // 3. Trích xuất dữ liệu
      const uiData = await getUiTokenBalance(page, asset.symbol);

      // 4. In log chuẩn đẹp
      const formattedSymbol = `[${asset.symbol}]`.padEnd(8, ' ');
      const formattedAmount = uiData.amount.padEnd(20, ' ');
      console.log(`🔹 ${formattedSymbol} | Balance: ${formattedAmount} | Value: ${uiData.usd}`);

      // 5. Kiểm tra kết quả
      expect(uiData.found).toBe(true);
    });
  }
});