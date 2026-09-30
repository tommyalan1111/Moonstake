// utils/gemini.ts
export async function askGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Cập nhật tên model ở đây
    contents: prompt,
  });
  return response.text;
}

export async function analyzeImageWithGemini(imageBuffer: Buffer, prompt: string): Promise<string> {
  const base64Image = imageBuffer.toString('base64');
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Cập nhật tên model ở đây
    contents: [
      // ...
    ],
  });
  return response.text;
}