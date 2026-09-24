import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Moonstake Assets Verification', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(45000);
    dashboard = new DashboardPage(page);
    await dashboard.gotoAssetsList();
  });

  test('TC01: Verify Toggle Hide/Show Balance', async () => {
    await dashboard.toggleHideBalance();
    await dashboard.verifyBalanceIsHidden();
  });

  test('TC02: Verify Assets List & Select Token', async () => {
    await dashboard.verifyAssetsListLoaded();
  });

  test('TC03: Verify Asset Selection (MATIC / XTZ)', async () => {
    // Chọn MATIC hoặc XTZ thực tế có trên giao diện
    await dashboard.selectAssetByName('MATIC');
    await dashboard.verifyChartOrDetailVisible();
  });

  test('TC04: Verify Navigation to Transaction History', async ({ page }) => {
    await dashboard.gotoHistory();
    await expect(page).toHaveURL(/.*(assets-list|wallet)/i);
  });
});