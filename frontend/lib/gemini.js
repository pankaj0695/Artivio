import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyBADZqm9p5gzNwJSc1wf762y5PqA3Y0Au4");

export async function getGeminiAnalysis(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "⚠️ Error: Could not fetch analysis.";
  }
}
