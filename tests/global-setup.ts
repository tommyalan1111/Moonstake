import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const statePath = path.join(process.cwd(), 'user_data', 'state.json');

  // Kiểm tra xem file state.json đã được tạo từ bước dán tay chưa
  if (fs.existsSync(statePath)) {
    console.log('✅ Đã tìm thấy file user_data/state.json. Sẵn sàng chạy Test Suite!');
  } else {
    console.warn('⚠️ CẢNH BÁO: Chưa tìm thấy file user_data/state.json!');
    console.warn('👉 Vui lòng đăng nhập tay trên Chrome, chạy script lấy session và dán vào user_data/state.json trước khi test.');
  }
}

export default globalSetup;