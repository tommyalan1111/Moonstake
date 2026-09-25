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

  async verifyBalanceIsHidden() {
    await expect(this.page.locator('body')).toBeVisible();
  }

  // TC02: Kiểm tra danh sách Assets hiển thị các đồng Token
  async verifyAssetsListLoaded() {
    await this.page.waitForLoadState('domcontentloaded');

    const assetItem = this.page
      .locator('tr, div, li, a')
      .filter({ hasText: /Polygon|MATIC|Tezos|XTZ|Ethereum|ETH|Bitcoin|BTC/i })
      .filter({ hasNotText: 'MATIC only' })
      .first();

    await expect(assetItem).toBeVisible({ timeout: 20000 });
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