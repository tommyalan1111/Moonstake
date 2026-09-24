import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Moonstake Dashboard & Assets Verification', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.gotoDashboard();
  });

  test('TC01: Verify Toggle Hide/Show Balance', async () => {
    await dashboard.toggleHideBalance();
    await dashboard.verifyBalanceIsHidden();
  });

  test('TC02: Verify Assets List & Select Token', async () => {
    await dashboard.assetItems.first().waitFor({ state: 'visible', timeout: 10000 });
    await expect(dashboard.assetItems.first()).toBeVisible();
  });

  test('TC03: Verify Price Chart Visibility', async () => {
    await dashboard.selectAssetByName('Cardano');
    await dashboard.verifyChartVisible();
  });

  test('TC04: Verify Navigation to Transaction History', async ({ page }) => {
    await dashboard.gotoHistory();
    await expect(page).toHaveURL(/.*wallet/i);
  });
});