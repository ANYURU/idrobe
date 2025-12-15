import { GoogleGenAI } from "@google/genai";

export async function enhanceOutfitWithAI(
  items: Array<{ name: string }>,
  weather: { condition: string; temperature: number; description?: string },
  apiKey: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Construct prompt
  const itemNames = items.map((i) => i.name).join(", ");
  const weatherDesc = weather.description ||
    `${weather.condition} (${weather.temperature}°C)`;

  const prompt = `
    Act as a personal fashion stylist.
    I have an outfit consisting of: ${itemNames}.
    The weather is ${weatherDesc}.
    
    Write a single, catchy, 1-sentence explanation of why this outfit is perfect for today.
    Focus on the style and practicality for the weather.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });

  const newReason = response.text?.trim();

  if (!newReason) {
    throw new Error("Empty response from AI");
  }

  return newReason;
}
