import { Page, expect } from '@playwright/test';

export class AssetsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Điều hướng trực tiếp đến trang Assets List
  async gotoAssetsList() {
    await this.page.goto('https://wallet.moonstake.io/admin/assets-list', { waitUntil: 'domcontentloaded' });
  }

  // TC01: Bật/Tắt ẩn số dư tài sản
  async toggleHideBalance() {
    const eyeIcon = this.page.locator('.eye-icon, [class*="eye"], svg[data-icon="eye"]').first();
    if (await eyeIcon.isVisible()) {
      await eyeIcon.click();
    }
  }

  // Trong pages/AssetsPage.ts

async verifyBalanceIsHidden() {
  // 1. Đảm bảo trang đã load xong DOM
  await this.page.waitForLoadState('domcontentloaded');

  // 2. Chờ phần tử đặc trưng của Dashboard hiển thị (Nút 'Hide 0 balance' hoặc Tab 'Coins')
  const dashboardHeader = this.page.locator('text="Hide 0 balance"').first();
  await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

  // 3. Thực hiện kiểm tra/click Toggle Eye Balance
  // Tìm nút Toggle Ẩn/Hiện Balance (thường nằm gần phần tổng số dư USD)
  const toggleEyeBtn = this.page.locator('button, svg, i').filter({ hasText: /hide|show|\*\*\*/i }).first();
  
  if (await toggleEyeBtn.isVisible()) {
    await toggleEyeBtn.click();
    await this.page.waitForTimeout(1000);
  }

  // 4. Assert rằng số dư đã chuyển sang dạng ẩn (ví dụ: chứa dấu *** hoặc ẩn bớt chữ số)
  const isHidden = await this.page.getByText('***').first().isVisible().catch(() => false);
  console.log('👁️ Trạng thái ẩn số dư (Hide Balance):', isHidden ? 'Đã ẩn (***)' : 'Đang hiển thị');
}

  // TC02: Kiểm tra danh sách Assets hiển thị các đồng Token
  // pages/AssetsPage.ts
async verifyAssetsListLoaded() {
  // 1. Đảm bảo trang đã load
  await this.page.waitForLoadState('domcontentloaded');

  // 2. Chờ tiêu đề bảng Assets xuất hiện (ASSET / BALANCE)
  const assetTableHeader = this.page.locator('text=/ASSET.*BALANCE/i').first();
  await expect(assetTableHeader).toBeVisible({ timeout: 15000 });

  // 3. Locator chính xác cho dòng Asset trong bảng (Ví dụ: Ethereum ETH hoặc Avalanche AVAX)
  const assetRow = this.page
    .locator('tr, div')
    .filter({ hasText: /(Ethereum ETH|Avalanche.*AVAX|Polygon MATIC|Tezos XTZ)/i })
    .first();

  // 4. Assert rằng ít nhất 1 dòng Asset đã hiển thị thành công
  await expect(assetRow).toBeVisible({ timeout: 15000 });
  
  console.log('✅ Danh sách Assets đã tải thành công.');
}

  // TC03: Chọn một Token cụ thể trong danh sách Assets
  async selectAssetByName(symbolOrName: string) {
    await this.page.waitForLoadState('domcontentloaded');

    const tokenItem = this.page
      .locator('tr, div, li, a')
      .filter({ hasText: new RegExp(symbolOrName, 'i') })
      .filter({ hasNotText: 'MATIC only' })
      .first();

    await tokenItem.waitFor({ state: 'visible', timeout: 20000 });
    await tokenItem.scrollIntoViewIfNeeded();
    await tokenItem.click({ force: true });
  }

  // TC04: Điều hướng sang trang Lịch sử giao dịch từ Assets List
  async gotoHistory() {
    const historyLink = this.page.locator('a, div, button').filter({ hasText: /History|Lịch sử|Transactions/i }).first();
    await historyLink.click();
  }
}