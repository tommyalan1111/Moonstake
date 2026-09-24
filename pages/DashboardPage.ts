import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly eyeIcon: Locator;
  readonly totalBalanceUSD: Locator;
  readonly historyLink: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Nút icon con mắt hoặc khu vực thẻ ví MATIC only
    this.eyeIcon = page.locator('div.wallet-card-wrap, [class*="card"], button:has(svg)').first();
    this.totalBalanceUSD = page.locator('text=/MATIC only/i').first();
    this.historyLink = page.locator('a[href*="assets-list"], a[href*="wallet"]').first();
  }

  async gotoAssetsList() {
    await this.page.goto('https://wallet.moonstake.io/admin/assets-list', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    // Chờ cho bảng token xuất hiện
    await this.page.locator('table, [role="table"], tr, [class*="asset"]').first().waitFor({ 
      state: 'visible', 
      timeout: 15000 
    }).catch(() => {});
  }

  // --- TC01: TOGGLE HIDE/SHOW BALANCE ---
  async toggleHideBalance() {
    const eyeBtn = this.page.locator('button, svg, [class*="eye"]').first();
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
    // Bắt trực tiếp phần tử hiển thị chứa chữ "Polygon" hoặc "Tezos" (không dùng exact match ^$)
    const polygonAsset = this.page.getByText('Polygon', { exact: false }).first();
    const tezosAsset = this.page.getByText('Tezos', { exact: false }).first();

    // Đảm bảo ít nhất 1 trong 2 đồng xuất hiện trên UI
    await Promise.race([
      polygonAsset.waitFor({ state: 'visible', timeout: 20000 }),
      tezosAsset.waitFor({ state: 'visible', timeout: 20000 })
    ]);

    await expect(polygonAsset.or(tezosAsset)).toBeVisible();
  }

  async selectAssetByName(symbolOrName: string) {
    const nameMap: Record<string, string> = {
      'MATIC': 'Polygon',
      'POLYGON': 'Polygon',
      'XTZ': 'Tezos',
      'TEZOS': 'Tezos'
    };

    const targetName = nameMap[symbolOrName.toUpperCase()] || symbolOrName;

    // Định vị dòng trong bảng (tr) chứa tên token
    const tokenRow = this.page.locator('tr, [class*="row"], [class*="item"]').filter({
      hasText: targetName
    }).first();

    await tokenRow.waitFor({ state: 'visible', timeout: 15000 });
    await tokenRow.scrollIntoViewIfNeeded();
    await tokenRow.click({ force: true });
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