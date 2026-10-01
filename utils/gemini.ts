import { GoogleGenAI } from '@google/genai';

// 1. Khởi tạo client Gemini từ biến môi trường
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function askGemini(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('❌ Khuyết GEMINI_API_KEY. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || '';
}

export async function analyzeImageWithGemini(
  imageBuffer: Buffer,
  prompt: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('❌ Khuyết GEMINI_API_KEY. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.');
  }

  const base64Image = imageBuffer.toString('base64');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image,
        },
      },
    ],
  });

  return response.text || '';
}