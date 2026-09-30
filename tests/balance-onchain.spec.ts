import { test, expect } from '@playwright/test';

const TEST_WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || '0x8bd50ecf6f8eac4d90c49bb7575c4c5894f7cef0';
const TEZOS_WALLET_ADDRESS = process.env.TEZOS_WALLET_ADDRESS || 'tz1afTtDDye7CueYDp8EvZLAX43Sw9HBiNci';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'V236XENUCQNQ2TWMB3UX4NENH2UX7M4FTS';

interface AssetConfig {
  symbol: string;
  name?: string;
  type: 'NATIVE' | 'ERC20' | 'TEZOS' | 'AVAX';
  tabName: 'Coins' | 'Tokens';
  chainId?: number;
  contractAddress?: string;
  walletAddress?: string;
  rpcUrl?: string;
  decimals: number;
}

const ASSETS_TO_VERIFY: AssetConfig[] = [
  {
    symbol: 'ETH',
    type: 'NATIVE',
    tabName: 'Coins',
    chainId: 1,
    decimals: 18,
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    type: 'NATIVE',
    tabName: 'Coins',
    chainId: 137,
    decimals: 18,
  },
  {
    symbol: 'XTZ',
    name: 'Tezos',
    type: 'TEZOS',
    tabName: 'Coins',
    walletAddress: TEZOS_WALLET_ADDRESS,
    decimals: 6,
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche (C-Chain)',
    type: 'AVAX',
    tabName: 'Coins',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    decimals: 18,
  },
  {
    symbol: 'USDT',
    type: 'ERC20',
    tabName: 'Tokens',
    chainId: 1,
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
  },
];

test.describe('On-Chain Balance Integrity Verification', () => {
  test.setTimeout(60000);

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
        // BƯỚC 1: Đảm bảo trang đã hết Loading & Chuyển Tab (Coins / Tokens)
        // -------------------------------------------------------------
        // Đợi overlay "Loading..." biến mất hoàn toàn
        await page.locator('text=Loading...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});

        const tabElement = page
          .getByRole('tab', { name: new RegExp(asset.tabName, 'i') })
          .or(page.locator('[role="tab"], div, button, a, li').filter({ hasText: new RegExp(`^\\s*${asset.tabName}`, 'i') }))
          .first();

        if (await tabElement.isVisible()) {
          await tabElement.click();
        }

        // -------------------------------------------------------------
        // BƯỚC 2: Lấy số dư hiển thị trên UI Moonstake (Playwright Best Practice)
        // -------------------------------------------------------------
        const uiBalanceElement = page
          .locator('div.balance')
          .filter({ hasText: asset.symbol })
          .first();

        // Sử dụng web-first assertion tự động retry cho đến khi phần tử xuất hiện thực sự trên UI
        await expect(uiBalanceElement).toBeVisible({ timeout: 30000 });

      const uiBalanceText = await uiBalanceElement.innerText();
      // Trích xuất chính xác số lượng coin đứng trước symbol (tránh bị lẫn số tiền USD bên dưới)
      const balanceMatch = uiBalanceText.match(new RegExp(`([0-9]+(?:\\.[0-9]+)?)\\s*${asset.symbol}`, 'i'));
      const uiBalance = balanceMatch 
        ? parseFloat(balanceMatch[1]) 
        : parseFloat(uiBalanceText.replace(/[^0-9.-]+/g, ''));
      console.log(`[UI] ${asset.symbol} Balance: ${uiBalance}`);

      // -------------------------------------------------------------
      // BƯỚC 3: Gọi API Blockchain lấy On-Chain Balance
      // -------------------------------------------------------------
      let onChainBalance = 0;
      const baseUrl = 'https://api.etherscan.io/v2/api';
      const evmAddress = asset.walletAddress || TEST_WALLET_ADDRESS;

      if (asset.type === 'NATIVE') {
        const chainId = asset.chainId || 1;
        const apiUrl = `${baseUrl}?chainid=${chainId}&module=account&action=balance&address=${evmAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
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
        const chainId = asset.chainId || 1;
        const apiUrl = `${baseUrl}?chainid=${chainId}&module=account&action=tokenbalance&contractaddress=${asset.contractAddress}&address=${evmAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
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
      } else if (asset.type === 'TEZOS') {
        const tezosAddress = asset.walletAddress || TEZOS_WALLET_ADDRESS;
        // Sử dụng TzKT Public API của Tezos
        const apiUrl = `https://api.tzkt.io/v1/accounts/${tezosAddress}/balance`;
        const response = await request.get(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (response.ok()) {
          const text = (await response.text()).trim();
          const rawBalance = BigInt(text);
          onChainBalance = Number(rawBalance) / Math.pow(10, asset.decimals);
        } else {
          throw new Error(`[TzKT API Error] Status: ${response.status()}, Body: ${await response.text()}`);
        }
      } else if (asset.type === 'AVAX') {
  // Danh sách các Public RPC ổn định của Avalanche C-Chain
  const avaxRpcList = [
    asset.rpcUrl || 'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche.drpc.org',
    'https://1rpc.io/avax/c',
    'https://rpc.ankr.com/avalanche',
  ];

  let success = false;

  for (const rpcUrl of avaxRpcList) {
    try {
      const response = await request.post(rpcUrl, {
        data: {
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [evmAddress, 'latest'],
          id: 1,
        },
        headers: {
          'Content-Type': 'application/json',
          // Thêm User-Agent để tránh bị Cloudflare/WAF block request từ script
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000, // Timeout 10s cho mỗi RPC
      });

      // Kiểm tra xem response có phải JSON hợp lệ hay không trước khi parse
      const contentType = response.headers()['content-type'] || '';
      if (response.ok() && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.result) {
          const rawBalance = BigInt(data.result);
          onChainBalance = Number(rawBalance) / Math.pow(10, asset.decimals);
          success = true;
          break; // Thành công thì thoát vòng lặp
        }
      }
    } catch (error) {
      console.warn(`[AVAX RPC Warning] RPC ${rpcUrl} thất bại, thử endpoint tiếp theo...`);
    }
  }

  if (!success) {
    throw new Error(`[Avalanche RPC Error]: Tất cả các RPC endpoints đều không phản hồi JSON hợp lệ.`);
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