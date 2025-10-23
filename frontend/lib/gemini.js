export async function getGeminiAnalysis(prompt, options = {}) {
  const { maxTokens = 2048, temperature = 0.2 } = options || {};

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_FLASK_API_BASE_URL}/content/prompt`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, maxTokens, temperature }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.message || "Request to prompt endpoint failed";
      console.error("Prompt API Error:", data);
      return `⚠️ Error: ${message}`;
    }

    const text = (data && data.text ? String(data.text) : "").trim();
    return text || "⚠️ No text returned.";
  } catch (error) {
    console.error("Backend prompt API Error:", error);
    return "⚠️ Error: Could not fetch analysis.";
  }
}
