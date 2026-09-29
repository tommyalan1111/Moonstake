import { test, expect } from '@playwright/test';
import { analyzeImageWithGemini, askGemini } from '../utils/gemini';

test.describe('Gemini AI Powered Testing', () => {

  test('1. Hỏi Gemini trợ giúp trực tiếp trong Test Case', async () => {
    const prompt = 'Hãy liệt kê 3 lợi ích ngắn gọn của việc kết hợp AI vào Automation Testing.';
    const aiAnswer = await askGemini(prompt);
    
    console.log('\n🤖 [Gemini Answer]:\n', aiAnswer);
    expect(aiAnswer).toBeTruthy();
  });

  test('2. Chụp màn hình và nhờ Gemini phân tích UI', async ({ page }) => {
    // Chuyển đến trang Assets List
    await page.goto('/admin/assets-list');
    await page.waitForTimeout(3000);

    // 1. Chụp ảnh màn hình toàn trang
    const screenshotBuffer = await page.screenshot({ fullPage: true });

    // 2. Gửi ảnh + prompt cho Gemini
    console.log('📸 Đang gửi screenshot cho Gemini AI kiểm tra UI...');
    
    const prompt = `
      Bạn là một QA Automation Senior. Hãy kiểm tra hình ảnh màn hình này và trả lời các câu hỏi:
      1. Màn hình này hiển thị danh sách các tài sản (Assets) nào?
      2. Có phát hiện lỗi hiển thị, vỡ layout, hoặc văn bản bị tràn/chồng chéo lên nhau không?
      Trả lời ngắn gọn, súc tích theo dạng danh sách.
    `;

    const aiAnalysis = await analyzeImageWithGemini(screenshotBuffer, prompt);

    console.log('\n--- KẾT QUẢ ĐÁNH GIÁ TỪ GEMINI AI ---');
    console.log(aiAnalysis);
    console.log('-------------------------------------\n');
  });

});