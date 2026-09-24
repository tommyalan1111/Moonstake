import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

// Nạp session đã lưu để không bị vướng Cloudflare/Sign-in
test.use({ storageState: 'auth.json' });

test.describe('Moonstake Dashboard & Assets Verification', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.gotoDashboard();
  });

  test('TC01: Verify Toggle Hide/Show Balance', async () => {
    // Click ẩn số dư
    await dashboard.toggleHideBalance();
    await dashboard.verifyBalanceIsHidden();

    // Click hiện lại số dư
    await dashboard.toggleHideBalance();
    await expect(dashboard.totalBalanceUSD).toBeVisible();
  });

 test('TC02: Verify Assets List & Select Token', async () => {
  // Wait explicitly for the first asset item to appear after dynamic fetch completes
  await dashboard.assetItems.first().waitFor({ state: 'visible', timeout: 10000 });
  await expect(dashboard.assetItems.first()).toBeVisible();
  
  // Select first coin
  await dashboard.selectAssetItem(0);
});

  test('TC03: Verify Price Chart Visibility', async () => {
  // Explicitly select a coin row to load its detail chart view
  await dashboard.selectAssetByName('Cardano');
  await dashboard.verifyChartVisible();
});

  test('TC04: Verify Navigation to Transaction History', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.gotoDashboard();
  
  // Điều hướng đến History và xác minh URL/UI thay đổi
  await dashboard.gotoHistory();
  await expect(page).toHaveURL(/.*history/i);
});
});