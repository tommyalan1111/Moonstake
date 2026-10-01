import { test, expect, Page } from '@playwright/test';
import { TARGET_ASSETS, AssetConfig } from '../config/networks';

// ============================================================================
// 1. HÀM ĐỌC SỐ DƯ ON-CHAIN TỪ RPC / API
// ============================================================================
async function getOnChainBalance(asset: AssetConfig): Promise<number> {
  // Lấy danh sách RPC URL trực tiếp từ asset config
  const rpcString = asset.rpcUrl || 'https://cloudflare-eth.com, https://eth.llamarpc.com, https://ethereum-rpc.publicnode.com';
  const rpcUrls: string[] = rpcString.split(',').map((u: string) => u.trim());

  if (rpcUrls.length === 0) {
    throw new Error(`❌ Không tìm thấy cấu hình rpcUrl cho tài sản ${asset.symbol}`);
  }

  // A. EVM Native (ETH, BNB...)
  if (asset.network === 'evm' && !asset.contractAddress) {
    let lastError: string = 'Không thể kết nối RPC Node';

    for (const url of rpcUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [asset.address, 'latest'],
            id: 1,
          }),
        });

        if (!res.ok) {
          lastError = `HTTP ${res.status} từ ${url}`;
          continue;
        }

        const data = await res.json();
        if (data?.error) {
          lastError = `RPC Error (${url}): ${data.error.message || JSON.stringify(data.error)}`;
          continue;
        }

        if (data?.result) {
          const balanceWei = BigInt(data.result);
          return Number(balanceWei) / 1e18;
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }
    throw new Error(`❌ RPC Native error cho ${asset.symbol}: ${lastError}`);
  }

  // B. EVM Token (USDT, ERC20...) - ĐỌC DECIMALS ĐỘNG
  if ((asset.network === 'evm-token' || asset.contractAddress) && asset.contractAddress) {
    const cleanAddress = asset.address.replace(/^0x/, '').padStart(64, '0');
    const balancePayload = `0x70a08231${cleanAddress}`; // balanceOf(address)
    const decimalsPayload = `0x313ce567`;              // decimals()

    let lastError: string = 'Không thể kết nối đến tất cả các RPC node';

    for (const url of rpcUrls) {
      try {
        const resBalance = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: asset.contractAddress, data: balancePayload }, 'latest'],
            id: 1,
          }),
        });

        if (!resBalance.ok) {
          lastError = `HTTP Status ${resBalance.status} từ ${url}`;
          continue;
        }

        const balanceData = await resBalance.json();

        if (balanceData?.error) {
          lastError = `RPC Error (${url}): ${balanceData.error.message || JSON.stringify(balanceData.error)}`;
          continue;
        }

        if (balanceData?.result && balanceData.result !== '0x') {
          const balanceRaw = BigInt(balanceData.result);

          // Lấy số decimals động (fallback về asset.decimals hoặc 6)
          let decimals = asset.decimals ?? 6;
          try {
            const resDecimals = await fetch(url, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{ to: asset.contractAddress, data: decimalsPayload }, 'latest'],
                id: 2,
              }),
            });

            const decimalsData = await resDecimals.json();
            if (decimalsData?.result && decimalsData.result !== '0x') {
              decimals = Number(BigInt(decimalsData.result));
            }
          } catch {
            // Giữ giá trị fallback nếu contract không có phương thức decimals() public
          }

          return Number(balanceRaw) / Math.pow(10, decimals);
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }
    throw new Error(`❌ RPC ERC20 error cho ${asset.symbol}: ${lastError}`);
  }

  // C. Tezos (XTZ)
  if (asset.network === 'tezos' && asset.apiUrl) {
    try {
      const res = await fetch(`${asset.apiUrl}${asset.address}`);
      if (!res.ok) throw new Error(`Tezos API HTTP Status ${res.status}`);
      const data = await res.json();
      return (data?.balance || 0) / 1e6;
    } catch (err: any) {
      throw new Error(`❌ Tezos API error cho ${asset.symbol}: ${err?.message || String(err)}`);
    }
  }

  throw new Error(`Cấu hình tài sản không hợp lệ cho ${asset.symbol}`);
}

// ============================================================================
// 2. HÀM ĐỌC SỐ DƯ TỪ GIAO DIỆN UI
// ============================================================================
async function getUiTokenBalance(page: Page, asset: AssetConfig): Promise<{ amount: number; found: boolean }> {
  let result = { amount: 0, found: false };

  const isTokenTab = asset.network === 'evm-token' || !!asset.contractAddress;
  const tabName = isTokenTab ? 'Tokens' : 'Coins';

  // 1. Chờ UI tải xong và Switch Tab
  const targetTab = page.getByRole('tab', { name: tabName });
  await targetTab.waitFor({ state: 'visible', timeout: 15000 });
  await targetTab.click();
  await expect(targetTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });

  // 2. Định vị hàng chứa token và bóc tách số dư
  await expect(async () => {
    const coinRow = page
      .getByRole('row')
      .filter({ hasText: new RegExp(`\\b${asset.symbol}\\b`, 'i') })
      .first();

    await expect(coinRow).toBeVisible();

    const balanceCell = coinRow.getByRole('cell').nth(1);
    const cellText = (await balanceCell.innerText()).replace(/\s+/g, ' ').trim();

    const amountMatch = cellText.match(new RegExp(`([\\d\\.,]+)\\s*${asset.symbol}`, 'i'))
                     || cellText.match(/^([\d\.,]+)/);

    expect(amountMatch, `Không bóc tách được số dư từ ô Balance: "${cellText}"`).toBeTruthy();

    if (amountMatch) {
      const amountStr = amountMatch[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);

      result = {
        amount: isNaN(amount) ? 0 : amount,
        found: true,
      };
    }
  }).toPass({
    timeout: 20000,
    intervals: [500, 1000],
  });

  return result;
}

// ============================================================================
// 3. SUITE KIỂM THỬ PLAYWRIGHT
// ============================================================================
test.describe('On-Chain Balance Integrity Verification', () => {
  for (const asset of TARGET_ASSETS) {
    test(`Verify balance integrity for ${asset.symbol}`, async ({ page }) => {
      console.log(`\n--------------------------------------------------`);
      console.log(`🔍 Kiểm tra tài sản: ${asset.symbol}`);

      // BƯỚC 1: Lấy số dư On-Chain từ asset config
      const onChainBalance = await getOnChainBalance(asset);
      console.log(`🌐 On-Chain Balance: ${onChainBalance} ${asset.symbol}`);

      // BƯỚC 2: Điều hướng vào trang danh sách tài sản
      await page.goto('/admin/assets-list/', { waitUntil: 'networkidle' });

      // BƯỚC 3: Đọc số dư trực tiếp từ UI
      const uiData = await getUiTokenBalance(page, asset);

      if (uiData.found) {
        console.log(`📱 UI Balance: ${uiData.amount} ${asset.symbol}`);
      } else {
        console.log(`📱 UI Balance: Không tìm thấy ${asset.symbol} trên UI`);
      }

      // BƯỚC 4: So sánh On-Chain vs UI
      expect(uiData.found, `Không tìm thấy ${asset.symbol} trên giao diện UI!`).toBe(true);
      expect(uiData.amount).toBeCloseTo(onChainBalance, 3);
      console.log(`✅ [PASS]: Balance trùng khớp hoàn hảo!`);
    });
  }
});