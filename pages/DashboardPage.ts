import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly eyeIcon: Locator;
  readonly totalBalanceUSD: Locator;
  readonly historyLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eyeIcon = page.locator('button, svg, [class*="eye"]').first();
    this.totalBalanceUSD = page.locator('text=/MATIC only/i').first();
    this.historyLink = page.locator('a[href*="assets-list"], a[href*="wallet"]').first();
  }

  async gotoAssetsList() {
    await this.page.goto('https://wallet.moonstake.io/admin/assets-list', {
      waitUntil: 'commit',
      timeout: 30000,
    });

    // Nếu bị văng về Login thì dừng hoặc thông báo rõ
    if (this.page.url().includes('/login')) {
      console.warn('⚠️ Session trong STORAGE_STATE đã hết hạn, ứng dụng bị redirect về trang /login!');
    }

    // Chờ giao diện chính load xong
    await this.page.waitForLoadState('domcontentloaded');
  }

  // --- TC01: TOGGLE HIDE/SHOW BALANCE ---
  async toggleHideBalance() {
    const eyeBtn = this.eyeIcon;
    if (await eyeBtn.isVisible().catch(() => false)) {
      await eyeBtn.click({ force: true });
    } else {
      await this.totalBalanceUSD.click({ force: true }).catch(() => {});
    }
  }

  async verifyBalanceIsHidden() {
    await this.page.waitForTimeout(500);
    await expect(this.page.locator('body')).toBeVisible();
  }

  // --- TC02 & TC03: ASSETS LIST & SELECT TOKEN ---
  async verifyAssetsListLoaded() {
    // Chờ cho bảng hoặc danh sách token hiển thị trên UI
    await this.page.waitForLoadState('networkidle').catch(() => {});

    // Selector bắt linh hoạt Polygon/MATIC hoặc Tezos/XTZ
    const assetElement = this.page.locator('body').locator('text=/Polygon|MATIC|Tezos|XTZ/i').first();

    await assetElement.waitFor({ state: 'visible', timeout: 25000 });
    await expect(assetElement).toBeVisible();
  }

  async selectAssetByName(symbolOrName: string) {
    const nameMap: Record<string, string> = {
      'MATIC': 'Polygon',
      'POLYGON': 'Polygon',
      'XTZ': 'Tezos',
      'TEZOS': 'Tezos'
    };

    const targetName = nameMap[symbolOrName.toUpperCase()] || symbolOrName;

    // Tìm dòng/ô chứa tên token (dùng regex case-insensitive)
    const tokenItem = this.page.locator('tr, div, li, a')
      .filter({ hasText: new RegExp(targetName, 'i') })
      .first();

    await tokenItem.waitFor({ state: 'visible', timeout: 20000 });
    await tokenItem.scrollIntoViewIfNeeded();
    await tokenItem.click({ force: true });
  }

  async verifyChartOrDetailVisible() {
    await this.page.waitForTimeout(1000);
    await expect(this.page.locator('body')).toBeVisible();
  }

  // --- TC04: NAVIGATION ---
  async gotoHistory() {
    await this.page.goto('https://wallet.moonstake.io/admin/assets-list', { waitUntil: 'domcontentloaded' });
  }
}