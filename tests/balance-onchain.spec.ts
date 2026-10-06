import { test, expect, Page } from '@playwright/test';
import { TARGET_ASSETS, AssetConfig } from '../config/networks';
import * as dotenv from 'dotenv';
dotenv.config();

// ============================================================================
// 1. HÀM ĐỌC SỐ DƯ ON-CHAIN TỪ RPC / API
// ============================================================================
async function getOnChainBalance(asset: AssetConfig): Promise<number> {
  const infuraKey = process.env.INFURA_API_KEY || '5a9e189aa34c428688e0d37199ae29b2';

  // C. Xử lý riêng cho Tezos (XTZ) vì không dùng EVM RPC
  if (asset.network === 'tezos' || asset.symbol === 'XTZ') {
    const apiUrl = asset.apiUrl || 'https://api.tzkt.io/v1/accounts/';
    try {
      const res = await fetch(`${apiUrl}${asset.address}`);
      if (!res.ok) throw new Error(`Tezos API HTTP Status ${res.status}`);
      const data = await res.json();
      // TzKT trả về balance theo mutez (1 XTZ = 1,000,000 mutez)
      const balanceMutez = data?.balance || data?.spendableBalance || 0;
      return Number(balanceMutez) / 1e6;
    } catch (err: any) {
      throw new Error(`❌ Tezos API error cho ${asset.symbol}: ${err?.message || String(err)}`);
    }
  }

  // Xây dựng danh sách RPC ưu tiên dùng Infura cho các mạng EVM
  let rpcUrls: string[] = [];

  if (asset.symbol === 'ETH' || asset.symbol === 'USDT') {
    rpcUrls.push(`https://mainnet.infura.io/v3/${infuraKey}`);
    rpcUrls.push('https://eth.llamarpc.com');
  } else if (asset.symbol === 'MATIC') {
    rpcUrls.push(`https://polygon-mainnet.infura.io/v3/${infuraKey}`);
    rpcUrls.push('https://polygon-bor-rpc.publicnode.com');
  } else if (asset.symbol === 'AVAX') {
    // Dùng Infura Avalanche Mainnet hoặc public chuẩn
    rpcUrls.push(`https://avalanche-mainnet.infura.io/v3/${infuraKey}`);
    rpcUrls.push('https://api.avax.network/ext/bc/C/rpc');
  }

  // Lấy thêm từ asset.rpcUrl nếu có sẵn trong config
  if (asset.rpcUrl) {
    const extraUrls = asset.rpcUrl.split(',').map((u: string) => u.trim());
    rpcUrls.push(...extraUrls);
  }

  rpcUrls = Array.from(new Set(rpcUrls));

  if (rpcUrls.length === 0) {
    throw new Error(`❌ Không tìm thấy cấu hình rpcUrl cho tài sản ${asset.symbol}`);
  }

  // Kiểm tra tính hợp lệ của địa chỉ ví trước khi gọi RPC
  if (!asset.address || asset.address.trim() === '') {
    throw new Error(`❌ Địa chỉ ví (address) cho ${asset.symbol} bị trống hoặc không hợp lệ!`);
  }

  // A. EVM Native (ETH, AVAX, MATIC...)
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
            // Giữ giá trị fallback
          }

          return Number(balanceRaw) / Math.pow(10, decimals);
        } else {
          return 0; // Trả về 0 nếu ví không có token này
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }
    throw new Error(`❌ RPC ERC20 error cho ${asset.symbol}: ${lastError}`);
  }

  throw new Error(`Cấu hình tài sản không hợp lệ cho ${asset.symbol}`);
}

// ============================================================================
// 2. HÀM ĐỌC SỐ DƯ TỪ GIAO DIỆN UI (Đã tối ưu selector và chống bắt nhầm phần tử ẩn)
// ============================================================================
async function getUiTokenBalance(page: Page, asset: AssetConfig): Promise<{ amount: number; found: boolean }> {
  let result = { amount: 0, found: false };
  const isTokenTab = asset.network === 'evm-token' || !!asset.contractAddress;
  const tabName = isTokenTab ? 'Tokens' : 'Coins';

  // 1. Chủ động click chuyển đúng tab (nếu cần)
  try {
    const targetTab = page.getByRole('tab', { name: tabName }).or(page.locator(`text=${tabName}`));
    await targetTab.first().waitFor({ state: 'visible', timeout: 5000 });
    await targetTab.first().click();
    await page.waitForTimeout(1500);
  } catch {}

  // 2. Vòng lặp check thông minh với toPass
  await expect(async () => {
    // Định vị hàng chứa asset
    const assetRow = page.locator('tr, div.q-item, div.asset-row, li, div.token-item')
      .filter({ has: page.locator(`text=${asset.symbol}`) })
      .filter({ has: page.locator(':visible') })
      .first();

    // Nếu sau khi reload mà hàng chưa kịp hiện, throw lỗi nhẹ để toPass đợi render
    await expect(assetRow).toBeVisible({ timeout: 8000 });

    const balanceElement = assetRow.locator('.balance').first();
    await expect(balanceElement).toBeVisible({ timeout: 5000 });
    
    let cellText = (await balanceElement.innerText()).trim();
    console.log(`[DEBUG] Đọc UI cho ${asset.symbol} -> text thô trong .balance: "${cellText}"`);

    const amountMatch = cellText.match(new RegExp(`([\\d\\.,]+)\\s*${asset.symbol}`, 'i'))
                       || cellText.match(/^([\d\.,]+)/);

    expect(amountMatch, `Không bóc tách được số dư cho ${asset.symbol} từ text: "${cellText}"`).toBeTruthy();

    if (amountMatch) {
      const amountStr = amountMatch[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);

      // CHỈ RELOAD KHI: Số dư thực tế bằng 0 (chưa load được)
      if (amount === 0) {
        console.log(`⚠️ UI đang hiển thị 0 cho ${asset.symbol}, tiến hành bấm nút refresh trên giao diện...`);
        
        try {
          // Click thẳng vào icon reload (.icon-reload) để gọi lại API cập nhật dữ liệu mà giữ nguyên session
          const refreshIcon = page.locator('.icon-reload').first();
          await refreshIcon.click();
        } catch {
          // Fallback nếu không bấm được icon thì click vào tab để ép refresh
          await targetTab.first().click();
        }

        // QUAN TRỌNG: Đợi 4 giây cho UI xóa bảng cũ và render lại bảng mới sau khi bấm refresh
        await page.waitForTimeout(4000); 

        // Chờ thêm để chắc chắn hàng của asset đã xuất hiện trở lại trước khi vòng lặp check tiếp
        const assetRow = page.locator('tr, div.q-item, div.asset-row, li, div.token-item')
          .filter({ has: page.locator(`text=${asset.symbol}`) })
          .filter({ has: page.locator(':visible') })
          .first();
        await assetRow.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        
        throw new Error(`Đã bấm refresh cho ${asset.symbol}, quét lại lần nữa...`);
      }

      result = {
        amount: isNaN(amount) ? 0 : amount,
        found: true,
      };
    }
  }).toPass({
    timeout: 35000, // Tăng tổng thời gian cho phép retry sau khi reload
    intervals: [2000, 3000],
  });

  return result;
}

// ============================================================================
// 3. SUITE KIỂM THỬ PLAYWRIGHT (Đã lược bỏ code thừa, chạy trực tiếp mượt mà)
// ============================================================================
test.describe('On-Chain Balance Integrity Verification', () => {
  test('Verify balance integrity for all configured assets', async ({ page }) => {
    // Tăng thời gian timeout lên 90s để chạy thong thả toàn bộ danh sách
    test.setTimeout(90000);

    console.log(`\n🚀 Bắt đầu kiểm tra On-Chain vs UI cho toàn bộ danh sách tài sản...`);
    await page.goto('/admin/assets-list/', { waitUntil: 'networkidle' });

    // Đợi một nhịp ngắn cho trang web và bảng dữ liệu render ổn định hoàn toàn
    await page.waitForTimeout(2000);

    const failures: string[] = [];

    // Vòng lặp duyệt qua từng asset trên cùng một phiên bản browser
    for (const asset of TARGET_ASSETS) {
      console.log(`\n--------------------------------------------------`);
      console.log(`🔍 Kiểm tra tài sản: ${asset.symbol}`);

      try {
        // BƯỚC 1: Lấy số dư On-Chain
        const onChainBalance = await getOnChainBalance(asset);
        console.log(`🌐 On-Chain Balance: ${onChainBalance} ${asset.symbol}`);

        // BƯỚC 2: Đọc số dư từ UI
        const uiData = await getUiTokenBalance(page, asset);
        if (uiData.found) {
          console.log(`📱 UI Balance: ${uiData.amount} ${asset.symbol}`);
        } else {
          console.log(`📱 UI Balance: Không tìm thấy ${asset.symbol} trên UI`);
        }

        // BƯỚC 3: So sánh On-Chain vs UI
        expect(uiData.found, `Không tìm thấy ${asset.symbol} trên giao diện UI!`).toBe(true);
        expect(uiData.amount).toBeCloseTo(onChainBalance, 3);
        console.log(`✅ [PASS]: Balance ${asset.symbol} trùng khớp hoàn hảo!`);
      } catch (error: any) {
        console.error(`❌ [FAIL]: Lỗi khi kiểm tra ${asset.symbol} -> ${error.message}`);
        failures.push(`${asset.symbol}: ${error.message}`);
      }
    }

    // Báo cáo tổng kết ở cuối
    expect(failures, `Các tài sản không khớp:\n${failures.join('\n')}`).toEqual([]);
  });
});