import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly eyeIcon: Locator;
  readonly hiddenBalanceText: Locator;
  readonly totalBalanceUSD: Locator;
  readonly historyLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eyeIcon = page.locator('.eye-icon');
    this.hiddenBalanceText = page.locator('span').filter({ hasText: '.....' });
    this.totalBalanceUSD = page.getByText('0 USD').first();
    
    // Tìm phần tử History linh hoạt hơn (hỗ trợ cả link, button, hoặc menu item)
    this.historyLink = page.locator('a, button, [role="button"]')
      .filter({ hasText: /^History$/i })
      .first();
  }

  async gotoDashboard() {
    await this.page.goto('https://wallet.moonstake.io/admin/dashboard/', {
      waitUntil: 'domcontentloaded'
    });
  }

  async gotoHistory() {
    // Nếu nút History nằm trong trang Wallet hoặc trang chi tiết coin, chuyển sang tab Wallet trước
    const walletNav = this.page.getByText('Wallet', { exact: true }).first();
    if (await walletNav.isVisible()) {
      await walletNav.click();
    }

    // Chờ link History xuất hiện trước khi click
    await this.historyLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.historyLink.click();
  }
}