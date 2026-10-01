import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Hàm hỗ trợ Retry khi API trả về lỗi 503 / 429
 */
async function callGeminiWithRetry(fn: () => Promise<any>, retries = 3, delayMs = 2000): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === retries) throw error;
      console.warn(`⚠️ Gọi Gemini API thất bại (Lần ${attempt}/${retries}). Thử lại sau ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function askGemini(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('❌ Khuyết GEMINI_API_KEY. Vui lòng thêm GEMINI_API_KEY vào file .env');
  }

  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
  );

  return response.text || '';
}

export async function analyzeImageWithGemini(
  imageBuffer: Buffer,
  prompt: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('❌ Khuyết GEMINI_API_KEY. Vui lòng thêm GEMINI_API_KEY vào file .env');
  }

  const base64Image = imageBuffer.toString('base64');

  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
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
    })
  );

  return response.text || '';
}