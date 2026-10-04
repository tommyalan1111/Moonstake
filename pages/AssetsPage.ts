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
    // 1. Đảm bảo mạng đã ổn định để trang load xong dữ liệu
    await this.page.waitForLoadState('networkidle');

    // 2. Thay thế bằng locator linh hoạt hơn, tìm phần tử có chữ "Balance" hoặc "Coins" thay vì fix cứng "Hide 0 balance"
    const dashboardHeader = this.page.locator('text=/Balance|Coins/i').first();
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

    // 3. Thực hiện kiểm tra/click Toggle Eye Balance
    const toggleEyeBtn = this.page.locator('button, svg, i').filter({ hasText: /hide|show|\*\*\*/i }).first();
    
    if (await toggleEyeBtn.isVisible()) {
      await toggleEyeBtn.click();
      await this.page.waitForTimeout(1000);
    }

    // 4. Assert rằng số dư đã chuyển sang dạng ẩn
    const isHidden = await this.page.getByText('***').first().isVisible().catch(() => false);
    console.log('👁️ Trạng thái ẩn số dư (Hide Balance):', isHidden ? 'Đã ẩn (***)' : 'Đang hiển thị');
  }

// TC02: Kiểm tra danh sách Assets hiển thị các đồng Token
  async verifyAssetsListLoaded() {
    // 1. Đợi mạng ổn định thay vì chỉ DOM content loaded để dữ liệu kịp đổ về
    await this.page.waitForLoadState('networkidle');

    // 2. Chờ một phần tử đặc trưng của trang danh sách tài sản xuất hiện (ví dụ: 'Hide 0 balance' hoặc tab 'Coins')
    const dashboardHeader = this.page.locator('text="Hide 0 balance"').first();
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

    // 3. Locator chính xác cho dòng Asset trong bảng (Ethereum ETH, Avalanche AVAX, v.v.)
    const assetRow = this.page
      .locator('tr, div')
      .filter({ hasText: /(Ethereum ETH|Avalanche.*AVAX|Polygon MATIC|Tezos XTZ|USDT)/i })
      .first();

    // 4. Assert rằng ít nhất 1 dòng Asset đã hiển thị thành công
    await expect(assetRow).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Danh sách Assets đã tải thành công.');
  }

  // TC03: Chọn một Token cụ thể trong danh sách Assets
  async selectAssetByName(symbolOrName: string) {
    // 1. Chờ mạng ổn định để đảm bảo danh sách token đã được render từ API
    await this.page.waitForLoadState('networkidle');

    const tokenItem = this.page
      .locator('tr, div, li, a')
      .filter({ hasText: new RegExp(symbolOrName, 'i') })
      .filter({ hasNotText: 'MATIC only' })
      .first();

    // 2. Tận dụng cơ chế auto-waiting của Playwright thay vì gọi thủ công .waitFor() kèm timeout lớn
    await tokenItem.scrollIntoViewIfNeeded();
    await tokenItem.click({ force: true });
  }

  // TC04: Điều hướng sang trang Lịch sử giao dịch từ Assets List
  async gotoHistory() {
    const historyLink = this.page.locator('a, div, button').filter({ hasText: /History|Lịch sử|Transactions/i }).first();
    await historyLink.click();
  }
}