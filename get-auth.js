const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launchPersistentContext('./user_data', {
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();
  await page.goto('https://wallet.moonstake.io');

  console.log('👉 Hãy tự đăng nhập trên màn hình. Sau khi vào đến Dashboard, nhấn ENTER ở Terminal này...');

  process.stdin.once('data', async () => {
    await page.context().storageState({ path: 'auth.json' });
    console.log('✅ Đã lưu auth.json thành công!');
    await browser.close();
    process.exit();
  });
})();