// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import fs from 'fs';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. Kiểm tra nếu state cũ vẫn dùng được thì bỏ qua đăng nhập lại
  if (fs.existsSync(authFile)) {
    await page.context().addCookies(JSON.parse(fs.readFileSync(authFile, 'utf-8')).cookies || []);
    await page.goto('/admin/assets-list');

    if (!page.url().includes('/sign-in')) {
      console.log('✅ Session state.json vẫn còn hiệu lực.');
      return;
    }
    console.log('⚠️ Session hết hạn, tiến hành đăng nhập lại...');
  }

  // 2. Sử dụng thông tin đăng nhập từ file .env
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('❌ Thiếu ADMIN_EMAIL hoặc ADMIN_PASSWORD trong file .env!');
  }

  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Chờ chuyển hướng thành công
  await page.waitForURL('**/admin/**');

  // Lưu lại state mới
  await page.context().storageState({ path: authFile });
  console.log('🎉 Đã cập nhật state.json mới thành công!');
});