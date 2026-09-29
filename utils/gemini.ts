import { GoogleGenAI } from '@google/genai';

// Tự động khởi tạo và lấy GEMINI_API_KEY từ file .env
const ai = new GoogleGenAI();

/**
 * Hàm gửi prompt dạng chữ cho Gemini
 */
export async function askGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text || '';
}

/**
 * Hàm gửi hình ảnh (Buffer screenshot) kèm prompt cho Gemini phân tích
 */
export async function analyzeImageWithGemini(imageBuffer: Buffer, prompt: string): Promise<string> {
  const base64Image = imageBuffer.toString('base64');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image,
        },
      },
      prompt,
    ],
  });

  return response.text || '';
}