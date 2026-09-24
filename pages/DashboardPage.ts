import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly eyeIcon: Locator;
  readonly hiddenBalanceText: Locator;
  readonly totalBalanceUSD: Locator;
  readonly assetItems: Locator;
  readonly lineChart: Locator;
  readonly historyLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Locator ẩn/hiện số dư
    this.eyeIcon = page.locator('.eye-icon, button:has(img)').first();
    this.hiddenBalanceText = page.locator('span').filter({ hasText: '.....' });
    this.totalBalanceUSD = page.getByText('0 USD').first();

    // Locator danh sách coin / bảng tài sản
    this.assetItems = page.locator('table tr, [role="row"], .asset-item');

    // Locator biểu đồ
    this.lineChart = page.locator('#line-chart, canvas').first();

    // Điều hướng Wallet (nơi chứa thông tin lịch sử/chi tiết)
    this.historyLink = page.getByText('Wallet', { exact: true }).first();
  }

  async gotoDashboard() {
    await this.page.goto('https://wallet.moonstake.io/admin/dashboard/', {
      waitUntil: 'domcontentloaded',
    });
  }

  // Sửa TC01: Khai báo hàm ẩn/hiện số dư
  async toggleHideBalance() {
    await this.eyeIcon.waitFor({ state: 'visible', timeout: 10000 });
    await this.eyeIcon.click();
  }

  async verifyBalanceIsHidden() {
    await expect(this.hiddenBalanceText.first()).toBeVisible();
  }

  // Sửa TC03: Khai báo hàm chọn coin theo tên
  async selectAssetByName(assetName: string) {
    const assetRow = this.page.getByRole('button', { name: new RegExp(assetName, 'i') }).first();
    await assetRow.waitFor({ state: 'visible', timeout: 10000 });
    await assetRow.click();
  }

  async verifyChartVisible() {
    await this.lineChart.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.lineChart).toBeVisible();
  }

  // Sửa TC04: Điều hướng tới mục Wallet/Lịch sử giao dịch
  async gotoHistory() {
    await this.historyLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.historyLink.click();
  }
}