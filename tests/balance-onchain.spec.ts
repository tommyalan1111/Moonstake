import { test, expect } from '@playwright/test';

const TEST_WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || '0x8bd50ecf6f8eac4d90c49bb7575c4c5894f7cef0';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'V236XENUCQNQ2TWMB3UX4NENH2UX7M4FTS';

interface AssetConfig {
  symbol: string;
  type: 'NATIVE' | 'ERC20';
  tabName: 'Coins' | 'Tokens';
  contractAddress?: string;
  decimals: number;
}

const ASSETS_TO_VERIFY: AssetConfig[] = [
  {
    symbol: 'ETH',
    type: 'NATIVE',
    tabName: 'Coins',
    decimals: 18,
  },
  {
    symbol: 'USDT',
    type: 'ERC20',
    tabName: 'Tokens',
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
  },
];

test.describe('On-Chain Balance Integrity Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/assets-list', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    if (page.url().includes('/sign-in')) {
      throw new Error('❌ Session hết hạn hoặc không tìm thấy state.json hợp lệ. Vui lòng chạy lại script auth-setup.ts!');
    }
  });

  for (const asset of ASSETS_TO_VERIFY) {
    test(`Verify balance for ${asset.symbol} (${asset.type})`, async ({ page, request }) => {      
      
      // -------------------------------------------------------------
      // BƯỚC 1: Chuyển Tab (Coins / Tokens)
      // -------------------------------------------------------------
      const tabElement = page.locator('div, button, a, li')
        .filter({ hasText: new RegExp(`^${asset.tabName}$`, 'i') })
        .last();

      if (await tabElement.isVisible()) {
        await tabElement.click({ force: true });
        await page.waitForTimeout(2000);
      }

      // -------------------------------------------------------------
      // BƯỚC 2: Lấy số dư hiển thị trên UI Moonstake
      // -------------------------------------------------------------
      const uiBalanceElement = page
        .locator('div.balance')
        .filter({ hasText: asset.symbol })
        .first();

      await uiBalanceElement.waitFor({ state: 'attached', timeout: 15000 });

      const uiBalanceText = await uiBalanceElement.innerText();
      const uiBalance = parseFloat(uiBalanceText.replace(/[^0-9.-]+/g, ''));
      console.log(`[UI] ${asset.symbol} Balance: ${uiBalance}`);

      // -------------------------------------------------------------
      // BƯỚC 3: Gọi Etherscan API V2 lấy On-Chain Balance
      // -------------------------------------------------------------
      let onChainBalance = 0;
      // Endpoint V2 của Etherscan yêu cầu thêm chainid=1 (Mainnet)
      const baseUrl = 'https://api.etherscan.io/v2/api';

      if (asset.type === 'NATIVE') {
        const apiUrl = `${baseUrl}?chainid=1&module=account&action=balance&address=${TEST_WALLET_ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
        const response = await request.get(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();
        
        if (data.status === '1') {
          const rawBalance = BigInt(data.result);
          onChainBalance = Number(rawBalance) / Math.pow(10, asset.decimals);
        } else {
          console.error('[Etherscan Raw Response]:', data);
          throw new Error(`[Etherscan API Error] Status: ${data.status}, Message: ${data.message}, Result: ${data.result}`);
        }
      } else if (asset.type === 'ERC20') {
        const apiUrl = `${baseUrl}?chainid=1&module=account&action=tokenbalance&contractaddress=${asset.contractAddress}&address=${TEST_WALLET_ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
        const response = await request.get(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();

        if (data.status === '1') {
          const rawBalance = BigInt(data.result);
          onChainBalance = Number(rawBalance) / Math.pow(10, asset.decimals);
        } else {
          console.error('[Etherscan Raw Response]:', data);
          throw new Error(`[Etherscan API Error] Status: ${data.status}, Message: ${data.message}, Result: ${data.result}`);
        }
      }

      console.log(`[On-Chain] ${asset.symbol} Balance: ${onChainBalance}`);

      // -------------------------------------------------------------
      // BƯỚC 4: So sánh UI vs On-Chain
      // -------------------------------------------------------------
      expect(uiBalance).toBeCloseTo(onChainBalance, 4);
    });
  }

});