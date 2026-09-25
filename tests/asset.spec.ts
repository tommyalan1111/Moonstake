import { test, expect } from '@playwright/test';
import { AssetsPage } from '../pages/AssetsPage';

test.describe('Moonstake Assets Verification', () => {
  let assetsPage: AssetsPage;

  test.beforeEach(async ({ page }) => {
    assetsPage = new AssetsPage(page);
    await assetsPage.gotoAssetsList();
  });

  test('TC01: Verify Toggle Hide/Show Balance', async () => {
    await assetsPage.toggleHideBalance();
    await assetsPage.verifyBalanceIsHidden();
  });

  test('TC02: Verify Assets List & Select Token', async () => {
    await assetsPage.verifyAssetsListLoaded();
  });

  test('TC03: Verify Asset Selection (MATIC / XTZ)', async () => {
    await assetsPage.selectAssetByName('MATIC');
  });

  test('TC04: Verify Navigation to Transaction History', async ({ page }) => {
    await assetsPage.gotoHistory();
    await expect(page).toHaveURL(/.*(assets-list|history|transactions)/i);
  });
});